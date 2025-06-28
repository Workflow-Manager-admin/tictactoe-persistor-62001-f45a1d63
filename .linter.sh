#!/bin/bash
cd /home/kavia/workspace/code-generation/tictactoe-persistor-62001-f45a1d63/tic_tac_toe_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

