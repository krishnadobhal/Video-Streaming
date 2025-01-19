# Video Streaming
A scalable microservices-based video streaming platform designed for efficient video upload, transcoding, and adaptive playback.

## Table of Contents
- [System Design](#system-design)
- [Getting Started](#getting-started)

## System Design

<div align="center">
  <img src="https://github.com/user-attachments/assets/8709448a-5b7f-496b-9fea-7b00a918f233" alt="System Design VS" />
</div>

## Getting Started

### Prerequisites

- Docker
- Docker Compose
- Node.js (for local development)

### Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/your-repo/project-name.git
    cd project-name
    ```

2. Create environment variable files for each service:

    [.env](http://_vscodecontentref_/1)

### Environment Variables

1. Frontend
\
Create a `.env` file in the [frontend](http://_vscodecontentref_/5) directory with the following content:

```env
DATABASE_URL=your_database_url
DRIZZLE_DATABASE_URL=your_drizzle_database_url
AUTH_SECRET=your_auth_secret
Github_Client=your_github_client_id
Github_Secret=your_github_client_secret
Google_Client=your_google_client_id
Google_Secret=your_google_client_secret
AUTH_TRUST_HOST=your_auth_trust_host
RESEND_API_KEY=your_resend_api_key
```
2. Transcode
\
Create a `.env` file in the [transcode-service](http://_vscodecontentref_/5) directory with the following content:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_BUCKET=yt-krishna
DATABASE_URL=your_database_url
```
3. Upload 
\
Create a `.env` file in the [Upload-service](http://_vscodecontentref_/5) directory with the following content:

```env
DATABASE_URL=your_database_url
BROKER=your_kafka_broker
AIVEN_PASS=your_aiven_password
AIVEN_USERNAME=your_aiven_username
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_BUCKET=your_aws_bucket
```
3. Watch
\
Create a `.env` file in the [Watch-service](http://_vscodecontentref_/5) directory with the following content:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_BUCKET=yt-krishna
DATABASE_URL=your_database_url
```


### Running the Project

1. Docker Compose

```docker-compose up --build```


### Local Environment

1. Frontend
    - Naviate to frontend
        
        ```cd frontend```

    - Install dependencies

        ```npm install```

    - Run the development server    

        ```npm run dev```

    - Open http://localhost:3000 with your browser to see the result.


2. Transcode
    - Naviate to frontend
        
        ```cd transcode-service```

    - Install dependencies

        ```npm install```

    - Run the development server    

        ```npm run dev```


4. watch
    - Naviate to frontend
        
        ```cd watch-service```

    - Install dependencies

        ```npm install```

    - Run the development server    

        ```npm run dev```

### License


```
Feel free to customize the content as needed for your specific project

