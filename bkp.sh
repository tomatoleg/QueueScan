#!/bin/bash

ts=$(date +"%m-%d-%y-%H:%M")
mkdir -p backups
zip "backups/backup-$ts.zip"  config/* frontend/* backend/*
