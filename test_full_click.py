#!/usr/bin/env python3
"""Test concurrent conversation loading like the client does (summary + messages + members)."""
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

def fetch_endpoint(conv_id, endpoint, label):
    t0 = time.time()
    try:
        url = f"http://localhost:8080/api/conversations/{conv_id}{endpoint}"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        resp = urllib.request.urlopen(req, timeout=30)
        data = resp.read()
        elapsed = time.time() - t0
        return {"id": conv_id[:8], "type": label, "status": resp.status, "ms": int(elapsed * 1000)}
    except Exception as e:
        elapsed = time.time() - t0
        return {"id": conv_id[:8], "type": label, "error": str(e)[:60], "ms": int(elapsed * 1000)}

conv_ids = [c["id"] for c in convs[:N]]
print(f"\nSimulating clicking on {N} conversations rapidly (3 req each = {N*3} total)...")
t_start = time.time()

with concurrent.futures.ThreadPoolExecutor(max_workers=N*3) as executor:
    futures = []
    for cid in conv_ids:
        # Each conversation click triggers 3 concurrent requests
        futures.append(executor.submit(fetch_endpoint, cid, "", "summary"))
        futures.append(executor.submit(fetch_endpoint, cid, "/messages", "messages"))
        futures.append(executor.submit(fetch_endpoint, cid, "/members", "members"))

    completed = 0
    for future in concurrent.futures.as_completed(futures):
        result = future.result()
        completed += 1
        if result.get("error") or result["ms"] > 5000:
            print(f"  [{completed}/{len(futures)}] {result}")
        elif completed % 10 == 0:
            print(f"  [{completed}/{len(futures)}] last: {result}")

total = time.time() - t_start
print(f"\nTotal: {int(total * 1000)}ms ({len(futures)} requests)")

# Now test if the server is still responsive
print("\nTesting server responsiveness after the burst...")
t0 = time.time()
try:
    req = urllib.request.Request("http://localhost:8080/api/auth/local-accounts")
    resp = urllib.request.urlopen(req, timeout=5)
    print(f"  /local-accounts: {resp.status} in {int((time.time()-t0)*1000)}ms")
except Exception as e:
    print(f"  /local-accounts: FAILED after {int((time.time()-t0)*1000)}ms - {e}")

t0 = time.time()
try:
    req = urllib.request.Request(f"http://localhost:8080/api/conversations/{conv_ids[0]}/members", headers={"Authorization": f"Bearer {token}"})
    resp = urllib.request.urlopen(req, timeout=5)
    print(f"  /members: {resp.status} in {int((time.time()-t0)*1000)}ms")
except Exception as e:
    print(f"  /members: FAILED after {int((time.time()-t0)*1000)}ms - {e}")
