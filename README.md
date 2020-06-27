# sortition

experimental pluggable hub server to validate data, then randomly return it

## Summary

This project is a component of [\_noisecrypt](low.show/noisecrypt/). The component provides the ability to redirect requests to a random selection from a set of URLs. The URLs are generally [sludge](https://github.com/lowshow/sludge) endpoints. A hub is created using the UI, and this can then be used in sludge to add/remove endpoints to the hub, or in [syllid](https://github.com/lowshow/syllid) to fetch random streams for playback.


## Install

-   Download [node](https://nodejs.org/en/download/) (tested with v14.4.0)

## Setup

### API

-   Before running, ensure files and directories exist:

```shell
make init
```

NOTE: You will need to provide values for these variables

**Nginx port**

This is the port from which the nginx proxy server for sortition will run

**Service hostname**

This is the base URL hostname where sortition will be accessed

**Additional hostnames**

More hostnames (not required)

**Sortition port**

Port to run the sortition node app

#### Dev

-   Pass environment variables and run:

```shell
SORTITION_PORT="8001" make run
```

