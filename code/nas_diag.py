#!/usr/bin/env python3
import asyncio
import os
from browser_use import Agent, Browser, ChatOpenAI

async def check_nas():
    browser = Browser(
        headless=False,
        window_size={'width': 1400, 'height': 900},
        cdp_url="http://localhost:9222",
    )
    
    llm = ChatOpenAI(model="gpt-4.1-mini")
    
    agent = Agent(
        task="""Go to http://172.22.22.239:5000/ and help me diagnose why adding SSD cache made the NAS slower.

Please:
1. Navigate to the NAS web interface
2. Find the SSD cache settings/configuration page  
3. Check the cache status, size, and any performance metrics
4. Look for any error messages or warnings related to SSD cache
5. Check if there's a read/write hit ratio for the cache

Report back what you find.""",
        browser=browser,
        llm=llm,
    )
    
    await agent.run()

if __name__ == "__main__":
    asyncio.run(check_nas())