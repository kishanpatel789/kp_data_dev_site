# This file is only used if you use `make publish` or
# explicitly specify it as your config file.

import os
import sys

sys.path.append(os.curdir)
from pelicanconf import *

# If your site is available via HTTPS, make sure SITEURL begins with https://
SITEURL = "https://kpdata.dev"
RELATIVE_URLS = False

DELETE_OUTPUT_DIRECTORY = True

# custom conf
DRAFT_URL = ""
DRAFT_SAVE_AS = ""

# Following items are often useful when publishing

# DISQUS_SITENAME = ""
GOOGLE_ANALYTICS = "G-5D6LDTCWT9"
