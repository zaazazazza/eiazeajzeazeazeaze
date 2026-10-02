#!/bin/bash
set -e
npm install
npm --prefix ./lib/db run push
