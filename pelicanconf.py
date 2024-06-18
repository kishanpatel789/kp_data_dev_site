AUTHOR = 'Kishan Patel'
SITENAME = 'KP Data Dev'
SITEURL = ""

PATH = "content"

TIMEZONE = 'US/Central'

DEFAULT_LANG = 'en'

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

DEFAULT_PAGINATION = 10

# Uncomment following line if you want document-relative URLs when developing
# RELATIVE_URLS = True

# custom conf
ARTICLE_URL = 'blog/{slug}/'
ARTICLE_SAVE_AS = 'blog/{slug}/index.html'
PAGE_URL = '{slug}/'
PAGE_SAVE_AS = '{slug}/index.html'
AUTHOR_SAVE_AS = ''  # don't generate author pages
CATEGORY_SAVE_AS = ''  # don't generate category pages
TAG_URL ='blog/tag/{slug}/'
TAG_SAVE_AS = 'blog/tag/{slug}/index.html'
DRAFT_URL = 'drafts/{slug}/'
DRAFT_SAVE_AS = 'drafts/{slug}/index.html'

PLUGINS = ['sitemap']

THEME = './theme'

DIRECT_TEMPLATES = ['index']
TEMPLATE_PAGES = {
    'archives.html': 'blog/index.html',
}

STATIC_PATHS = ['static']

EXTRA_PATH_METADATA = {
    'static/robots.txt': {'path': 'robots.txt'},
    }

DEFAULT_DATE_FORMAT = '%d %b %Y'

DEFAULT_METADATA = {
    'status': 'draft',
}

MARKDOWN = {
    'extension_configs': {
        'markdown.extensions.codehilite': {
            'css_class': 'highlight',
            'linenums': False,    
        },
        'markdown.extensions.extra': {},
        'markdown.extensions.meta': {},
    },
    'output_format': 'html5',
}

SITEMAP = {
    'format': 'xml',
}