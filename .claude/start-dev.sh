#!/bin/bash
export PATH="/opt/homebrew/Cellar/node@22/22.22.0_1/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
cd /Users/atlas/cutsheet
exec npm run dev -- --port 3001
