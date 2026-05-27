#!/usr/bin/env python3
"""Test concurrent /members requests to reproduce the hang."""
import json
import sys
import time
import urllib.request
import concurrent.futures

# Get token
login_data = json.dumps({"username": "0e56a1f62c0365f6", "authMethod": "local"}).encode()
req = urllib.request.Request("http://localhost:8080/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
resp = urllib.request.urlopen(req)
token = json.loads(resp.read())["accessToken"]
print(f"Got token")

# Get conversations
req = urllib.request.Request("http://localhost:8080/api/conversations", headers={"Authorization": f"Bearer {token}"})
resp = urllib.request.urlopen(req)
convs = json.loads(resp.read())
print(f"Got {len(convs)} conversations")

N = int(sys.argv[1]) if len(sys.argv) > 1 else 5

def fetch_members(conv_id):
    t0 = time.time()
    try:
        req = urllib.request.Request(
            f"http://localhost:8080/api/conversations/{conv_id}/members",
            headers={"Authorization": f"Bearer {token}"}
        )
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read())
        elapsed = time.time() - t0
        return {"id": conv_id[:8], "status": resp.status, "members": len(data), "ms": int(elapsed * 1000)}
    except Exception as e:
        elapsed = time.time() - t0
        return {"id": conv_id[:8], "error": str(e), "ms": int(elapsed * 1000)}

conv_ids = [c["id"] for c in convs[:N]]
print(f"Fetching /members for {N} conversations concurrently...")
t_start = time.time()

with concurrent.futures.ThreadPoolExecutor(max_workers=N) as executor:
    futures = {executor.submit(fetch_members, cid): cid for cid in conv_ids}
    for future in concurrent.futures.as_completed(futures):
        result = future.result()
        print(f"  {result}")

total = time.time() - t_start
print(f"\nTotal: {int(total * 1000)}ms")
