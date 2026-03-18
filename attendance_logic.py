from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import Enum
from typing import Iterable, Mapping, Sequence


class AttendanceStatus(str, Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    EXCUSED = "EXCUSED"


class AttendanceTier(str, Enum):
    EXCELLENT = "Excellent"
    SATISFACTORY = "Satisfactory"
    AT_RISK = "Low / At Risk"
    CRITICAL = "Critical"
    BARRED = "Fail / Barred"


class Validity(str, Enum):
    VALID = "Valid"
    AT_RISK = "At Risk"
    INVALID_BARRED = "Invalid / Barred"


class EscalationLevel(str, Enum):
    EARLY_WARNING = "Early Warning"
    ACADEMIC_ALERT = "Academic Alert"
    FORMAL_INTERVENTION = "Formal Intervention"
    CRITICAL_BARRED = "Critical - Barred"


@dataclass(frozen=True)
class PolicyConfig:
    """
    Policy defaults reflect the Week 1 report:
    - Use adjusted attendance % for status & escalation (excused removed from denominator).
    - Tier thresholds:
        91-100 Excellent, 75-90 Satisfactory, 60-74 At Risk, 50-59 Critical, <50 Barred
    - Escalation triggers (on adjusted %):
        <85 Early Warning, <75 Academic Alert, <65 Formal Intervention, <50 Critical - Barred
    """

    satisfactory_min_pct: float = 75.0
    at_risk_min_pct: float = 60.0
    critical_min_pct: float = 50.0
    excellent_min_pct: float = 91.0

    early_warning_below_pct: float = 85.0
    academic_alert_below_pct: float = 75.0
    formal_intervention_below_pct: float = 65.0
    critical_barred_below_pct: float = 50.0


@dataclass(frozen=True)
class AttendanceSummary:
    total_sessions: int
    present: int
    absent: int
    excused: int

    raw_pct: float
    adjusted_pct: float

    tier: AttendanceTier
    validity: Validity
    escalation: EscalationLevel | None

    @property
    def as_dict(self) -> dict:
        d = asdict(self)
        # Make enums JSON-friendly while keeping type safety internally.
        d["tier"] = self.tier.value
        d["validity"] = self.validity.value
        d["escalation"] = self.escalation.value if self.escalation else None
        return d


def _safe_pct(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return (numerator / denominator) * 100.0


def compute_attendance_summary(
    statuses: Iterable[str | AttendanceStatus],
    *,
    policy: PolicyConfig | None = None,
) -> AttendanceSummary:
    """
    Compute attendance evaluation from a list/iterable of statuses.

    Status values must match the DB enum in `attendance_records.status`:
    - PRESENT
    - ABSENT
    - EXCUSED
    """

    policy = policy or PolicyConfig()

    present = absent = excused = 0
    total = 0

    for s in statuses:
        total += 1
        try:
            status = AttendanceStatus(str(s).upper())
        except ValueError as exc:
            raise ValueError(
                f"Invalid attendance status {s!r}. Expected one of: "
                f"{', '.join(x.value for x in AttendanceStatus)}"
            ) from exc

        if status is AttendanceStatus.PRESENT:
            present += 1
        elif status is AttendanceStatus.ABSENT:
            absent += 1
        else:
            excused += 1

    raw_pct = _safe_pct(present, total)

    adjusted_total = total - excused
    adjusted_pct = 100.0 if adjusted_total == 0 and total > 0 else _safe_pct(present, adjusted_total)

    tier = _tier_for_pct(adjusted_pct, policy=policy)
    validity = _validity_for_pct(adjusted_pct, policy=policy)
    escalation = _escalation_for_pct(adjusted_pct, policy=policy)

    return AttendanceSummary(
        total_sessions=total,
        present=present,
        absent=absent,
        excused=excused,
        raw_pct=round(raw_pct, 2),
        adjusted_pct=round(adjusted_pct, 2),
        tier=tier,
        validity=validity,
        escalation=escalation,
    )


def compute_attendance_summary_from_counts(
    *,
    present: int,
    absent: int,
    excused: int,
    policy: PolicyConfig | None = None,
) -> AttendanceSummary:
    policy = policy or PolicyConfig()
    if min(present, absent, excused) < 0:
        raise ValueError("Counts cannot be negative.")

    total = present + absent + excused
    raw_pct = _safe_pct(present, total)

    adjusted_total = total - excused
    adjusted_pct = 100.0 if adjusted_total == 0 and total > 0 else _safe_pct(present, adjusted_total)

    tier = _tier_for_pct(adjusted_pct, policy=policy)
    validity = _validity_for_pct(adjusted_pct, policy=policy)
    escalation = _escalation_for_pct(adjusted_pct, policy=policy)

    return AttendanceSummary(
        total_sessions=total,
        present=present,
        absent=absent,
        excused=excused,
        raw_pct=round(raw_pct, 2),
        adjusted_pct=round(adjusted_pct, 2),
        tier=tier,
        validity=validity,
        escalation=escalation,
    )


def _tier_for_pct(pct: float, *, policy: PolicyConfig) -> AttendanceTier:
    if pct >= policy.excellent_min_pct:
        return AttendanceTier.EXCELLENT
    if pct >= policy.satisfactory_min_pct:
        return AttendanceTier.SATISFACTORY
    if pct >= policy.at_risk_min_pct:
        return AttendanceTier.AT_RISK
    if pct >= policy.critical_min_pct:
        return AttendanceTier.CRITICAL
    return AttendanceTier.BARRED


def _validity_for_pct(pct: float, *, policy: PolicyConfig) -> Validity:
    if pct >= policy.satisfactory_min_pct:
        return Validity.VALID
    if pct >= policy.at_risk_min_pct:
        return Validity.AT_RISK
    return Validity.INVALID_BARRED


def _escalation_for_pct(pct: float, *, policy: PolicyConfig) -> EscalationLevel | None:
    # Most severe match wins.
    if pct < policy.critical_barred_below_pct:
        return EscalationLevel.CRITICAL_BARRED
    if pct < policy.formal_intervention_below_pct:
        return EscalationLevel.FORMAL_INTERVENTION
    if pct < policy.academic_alert_below_pct:
        return EscalationLevel.ACADEMIC_ALERT
    if pct < policy.early_warning_below_pct and pct >= policy.satisfactory_min_pct:
        return EscalationLevel.EARLY_WARNING
    return None


def summarize_db_rows(
    rows: Sequence[Mapping[str, object]],
    *,
    status_key: str = "status",
    policy: PolicyConfig | None = None,
) -> AttendanceSummary:
    """
    Convenience helper for SQLite query results (dict-like rows).
    Expects each row to include a `status` field by default.
    """

    statuses: list[str] = []
    for r in rows:
        if status_key not in r:
            raise KeyError(f"Row is missing required key {status_key!r}.")
        statuses.append(str(r[status_key]))
    return compute_attendance_summary(statuses, policy=policy)
