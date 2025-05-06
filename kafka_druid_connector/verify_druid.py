#!/usr/bin/env python
"""
Simple script to verify Druid connection
"""

import requests
import time
import json

# Druid Configuration
DRUID_ROUTER_URL = 'http://localhost:28888'
DRUID_COORDINATOR_URL = 'http://localhost:28081'

def check_status():
    """Try to access various Druid endpoints to check status."""
    endpoints = {
        "Router Status": f"{DRUID_ROUTER_URL}/status",
        "Coordinator Status": f"{DRUID_COORDINATOR_URL}/status",
        "Router Health": f"{DRUID_ROUTER_URL}/status/health",
        "Coordinator Health": f"{DRUID_COORDINATOR_URL}/status/health",
        "Druid SQL": f"{DRUID_ROUTER_URL}/druid/v2/sql"
    }
    
    for name, url in endpoints.items():
        print(f"\nTrying to access {name} at {url}...")
        try:
            if name == "Druid SQL":
                # For SQL endpoint, need to send a POST request with a query
                response = requests.post(
                    url,
                    json={"query": "SELECT 1 AS result"},
                    headers={"Content-Type": "application/json"},
                    timeout=5
                )
            else:
                response = requests.get(url, timeout=5)
            
            print(f"Status code: {response.status_code}")
            if response.status_code == 200:
                print("Success!")
                try:
                    # Try to parse response as JSON
                    data = response.json()
                    print(f"Response data: {json.dumps(data, indent=2)[:200]}...")
                except:
                    print(f"Response text: {response.text[:200]}...")
            else:
                print(f"Failed with status code {response.status_code}")
                print(f"Response: {response.text[:200]}")
        except Exception as e:
            print(f"Error: {e}")

def main():
    """Main function to verify Druid connection."""
    print("\nStarting Druid connection verification...\n")
    
    # Give Druid time to initialize
    print("Checking Druid status...")
    check_status()
    
    print("\nVerification completed!")

if __name__ == "__main__":
    main() 