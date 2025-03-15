# Adhan DZ - Algerian Prayer Times API

A containerized solution for accessing Islamic prayer times in Algeria through a simple API. This project consists of two parts:
1. An extractor service that automatically downloads and extracts prayer time databases from the Marwalarm app
2. A web server that provides an API to access the prayer time data

## Table of Contents
- [Features](#features)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Deployment Options](#deployment-options)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [License](#license)

## Features

- Automatic download and extraction of prayer time databases
- Regular checks for app updates to ensure data is current
- RESTful API for accessing prayer times
- Support for multiple cities in Algeria
- Date range queries (up to 30 days)
- Docker-based deployment for easy setup

## Quick Start

### Prerequisites
- Docker and Docker Compose installed on your system

### Installation and Running

1. Clone this repository:
   ```bash
   git clone https://github.com/dexter21767/adhan-dz-api.git
   cd adhan-dz
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Access the API at http://localhost:3000

## API Documentation

### API Hosting

The API is currently hosted at [adhan-dz.dexter21767.com](https://adhan-dz.dexter21767.com).

### Available Endpoints

#### GET /
Home page with API documentation

#### GET /cities
Returns a list of all available cities

**Example Response:**
```json
[
  {
    "_id": 1,
    "ParentId": null,
    "MADINA_NAME": "الجلفة"
  },
  {
    "_id": 2,
    "ParentId": 1,
    "MADINA_NAME": "تبسة"
  }
]
```

#### GET /prayerTimes
Returns prayer times for specified cities and dates

**Query Parameters:**
- `cityId` (optional, integer): City ID to get prayer times for
- `startDate` (optional, string): Start date in YYYY-MM-DD format (defaults to today)
- `endDate` (optional, string): End date in YYYY-MM-DD format (if not provided, only returns data for the start date)

**Example Request:**
```
GET /prayerTimes?cityId=1&startDate=2025-03-15&endDate=2025-03-17
```

**Example Response:**
```json
[
  {
    "_id": 236688,
    "MADINA_ID": 1,
    "GeoDate": "2025-03-15",
    "Fajr": "5:34",
    "Shurooq": "6:58",
    "Kibla": "8:12",
    "Dhuhr": "12:56",
    "Asr": "16:21",
    "Maghrib": "18:58",
    "Isha": "20:14"
  },
  {
    "_id": 236689,
    "MADINA_ID": 1,
    "GeoDate": "2025-03-16",
    "Fajr": "5:33",
    "Shurooq": "6:56",
    "Kibla": "8:14",
    "Dhuhr": "12:56",
    "Asr": "16:21",
    "Maghrib": "18:59",
    "Isha": "20:15"
  },
  {
    "_id": 236690,
    "MADINA_ID": 1,
    "GeoDate": "2025-03-17",
    "Fajr": "5:31",
    "Shurooq": "6:55",
    "Kibla": "8:16",
    "Dhuhr": "12:56",
    "Asr": "16:21",
    "Maghrib": "19:00",
    "Isha": "20:16"
  }
]
```

## Deployment Options

### Local Deployment

Follow the [Quick Start](#quick-start) guide above.

### Production Deployment

For production environments, consider the following adjustments:

1. Edit the `docker-compose.yml` file to add a reverse proxy (like Nginx or Traefik) for SSL termination
2. Use environment variables for sensitive configuration:
   ```bash
   # Create a .env file in your project root
   PORT=3000
   TZ=Africa/Algiers
   ```
### Scheduled Updates

To ensure the prayer time data is always up-to-date, you can set up a cron job to run the extractor service every week.

1. Open your crontab file:
    ```bash
    crontab -e
    ```

2. Add the following line to schedule the extractor to run every week:
    ```bash
    0 0 * * 0 cd /root/adhan-dz && docker-compose up extractor
    ```

This cron job will run the extractor service at midnight every Sunday.

3. Deploy with:
   ```bash
   docker-compose up server -d
   ```

## Development Setup

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Setting Up Local Development Environment

1. Set up the extractor:
   ```bash
   cd extractor
   # Run the extractor manually to get the initial database
   docker build -t adhan-extractor .
   docker run -v $(pwd)/../db:/db -e DB_DIR=/db adhan-extractor
   ```

2. Set up the server:
   ```bash
   cd ../server
   npm install
   npm run dev
   ```

## License

[MIT License](LICENSE)

## Acknowledgements

This project uses data extracted from the [Accurate Algerian prayer times app](https://play.google.com/store/apps/details?id=com.issolah.marwalarm). The data is used for informational purposes only.

---

**Disclaimer:** This project is NOT affiliated with or endorsed by the [marw.dz](http://marw.dz/).
