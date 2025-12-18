import logging
import traceback

def log_crash(e, context=""):
    with open("debug_crash.log", "a") as f:
        f.write(f"\n--- CRASH REPORT {context} ---\n")
        f.write(str(e))
        f.write("\n")
        f.write(traceback.format_exc())
        f.write("\n--------------------------\n")
