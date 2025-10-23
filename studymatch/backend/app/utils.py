from typing import Iterable, Set

def jaccard(a: Iterable[str], b: Iterable[str]) -> float:
    A: Set[str] = set(map(str.lower, a))
    B: Set[str] = set(map(str.lower, b))
    if not A and not B:
        return 0.0
    return len(A & B) / max(1, len(A | B))
