# gunicorn.conf.py
bind = '0.0.0.0:8000'
workers = 4
threads = 2
timeout = 120 
loglevel = 'info'
accesslog = '-'
errorlog = '-'
