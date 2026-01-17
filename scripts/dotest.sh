#!/bin/bash
# Conajra Solutions © 2026
# Author: Marwan

echo "building ..."
npm run build
echo "build successful!"

echo "running tests ..."
npm test
echo "tests passed!"
