# facebook-live-video
Stream a website with phantomjs to Facebook Live via ffmpeg (video) and collect Facebook reactions

# Installation

I installed everything on Ubuntu 16.04, for other versions check docs how to install.

## FFmpeg

```
sudo apt-get update
sudo apt-get install ffmpeg
``` 

## NodeJS

Install latest NodeJS on your server - you can do it ;) 

## phantomjs

I used the self-contained binary. Check http://phantomjs.org/download.html

```
sudo apt-get update
sudo apt-get install build-essential g++ flex bison gperf ruby perl \
  libsqlite3-dev libfontconfig1-dev libicu-dev libfreetype6 libssl-dev \
  libpng-dev libjpeg-dev python libx11-dev libxext-dev
wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
tar -xf phantomjs-2.1.1-linux-x86_64.tar.bz2
rm -rf phantomjs-2.1.1-linux-x86_64.tar.bz2
sudo cp phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/bin/
rm -R phantomjs-2.1.1-linux-x86_64
sudo apt-get remove phantomjs
sudo apt-get install phantomjs
```

