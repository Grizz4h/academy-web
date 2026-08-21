"""Shared JSON file helpers: exclusive flock + atomic replace."""

from __future__ import annotations

import json
import os
import threading
import time
from contextlib import contextmanager
from typing import Any, Iterator, Optional

try:
    import fcntl
except ImportError:  # pragma: no cover
    fcntl = None  # type: ignore


def atomic_write_json(path: str, data: Any) -> None:
    """Write JSON via tmp + os.replace (crash-safe replace)."""
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def read_json(path: str, default: Optional[Any] = None) -> Any:
    if not os.path.exists(path):
        if default is not None:
            return default
        raise FileNotFoundError(path)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class FileLock:
    """Process + thread exclusive lock keyed by a lock file path."""

    def __init__(self, lock_path: str, *, timeout_s: float = 30.0):
        self.lock_path = lock_path
        self.timeout_s = timeout_s
        self._thread_lock = threading.RLock()

    @contextmanager
    def exclusive(self) -> Iterator[None]:
        self._thread_lock.acquire()
        lock_file = None
        try:
            os.makedirs(os.path.dirname(self.lock_path) or ".", exist_ok=True)
            lock_file = open(self.lock_path, "a+", encoding="utf-8")
            if fcntl is not None:
                deadline = time.time() + self.timeout_s
                while True:
                    try:
                        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                        break
                    except BlockingIOError:
                        if time.time() >= deadline:
                            from .errors import StorageError

                            raise StorageError(f"Could not lock: {self.lock_path}")
                        time.sleep(0.05)
            yield
        finally:
            if lock_file is not None:
                try:
                    if fcntl is not None:
                        fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
                finally:
                    lock_file.close()
            self._thread_lock.release()
