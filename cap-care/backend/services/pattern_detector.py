"""
services/pattern_detector.py
------------------------------
A simple, deterministic, rule-based pattern detector -- NO machine
learning. It looks at a user's logged events and checks whether a
specific trigger (food, medicine, or activity) has repeatedly appeared
shortly before a specific symptom, across multiple separate occasions.

IMPORTANT: this NEVER claims causation. A repeated pairing is reported
as a "recurring association" found in the user's own logs, always
paired with a reminder that this is not a diagnosis. That wording is
enforced here in the service layer, not left to the router or the
frontend, so it can never accidentally be dropped.
"""

from datetime import timedelta
from collections import defaultdict
from typing import List, Dict

# How far back (in hours) before a symptom we look for a possible trigger.
DEFAULT_WINDOW_HOURS = 24

# How many times a trigger/symptom pairing must repeat before we
# consider it worth surfacing to the user.
MIN_OCCURRENCES = 2

TRIGGER_EVENT_TYPES = {"food", "medicine", "activity"}


def detect_patterns(events: List[dict], window_hours: int = DEFAULT_WINDOW_HOURS) -> List[dict]:
    """
    Given a list of a user's events (each a dict with at least
    event_type, description, timestamp), find recurring associations
    between a trigger (food/medicine/activity) and a symptom that
    occurs within `window_hours` afterward.

    Parameters
    ----------
    events: list of dicts, each with keys "event_type", "description", "timestamp"
             (timestamp must be a datetime object, already sorted or not --
             this function sorts internally).
    window_hours: how many hours after a trigger event we still consider
             a symptom "possibly associated" with it.

    Returns
    -------
    A list of pattern dicts, one per (trigger_description, symptom_description)
    pair that met the minimum occurrence threshold, each shaped like:
        {
            "pattern_found": true,
            "trigger": "chocolate",
            "symptom": "stomach discomfort",
            "occurrences": 3,
            "message": "Your logs show a recurring association between these events.",
            "disclaimer": "This is not a diagnosis."
        }
    """
    sorted_events = sorted(events, key=lambda e: e["timestamp"])

    symptoms = [e for e in sorted_events if e["event_type"] == "symptom"]
    triggers = [e for e in sorted_events if e["event_type"] in TRIGGER_EVENT_TYPES]

    # pair_counts maps (trigger_description, symptom_description) -> count
    # of distinct times that pairing occurred within the time window.
    pair_counts: Dict[tuple, int] = defaultdict(int)

    for symptom in symptoms:
        window_start = symptom["timestamp"] - timedelta(hours=window_hours)
        for trigger in triggers:
            if window_start <= trigger["timestamp"] <= symptom["timestamp"]:
                key = (
                    trigger["description"].strip().lower(),
                    symptom["description"].strip().lower(),
                )
                pair_counts[key] += 1

    patterns = []
    for (trigger_desc, symptom_desc), count in pair_counts.items():
        if count >= MIN_OCCURRENCES:
            patterns.append({
                "pattern_found": True,
                "trigger": trigger_desc,
                "symptom": symptom_desc,
                "occurrences": count,
                "message": "Your logs show a recurring association between these events.",
                "disclaimer": "This is not a diagnosis.",
            })

    # Most-repeated patterns first, since those are the most notable.
    patterns.sort(key=lambda p: p["occurrences"], reverse=True)
    return patterns
