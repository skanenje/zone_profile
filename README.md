# Zone01 Profile

A web application that allows Apprentices and Piscine users view their profile information through a GraphQL API. The dashboard displays user stats, XP progression, skills, and audit information in an interactive interface.

## Features

- User authentication with JWT
- Interactive dashboard with:
  - XP progression chart
  - Skills visualization
  - Audit ratio statistics
  - Profile metrics

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- GraphQL API integration
- JWT authentication
- Docker containerization
- Nginx web server

## Project Structure

```
├── Dockerfile           # Docker container configuration
├── nginx.conf          # Nginx server configuration
├── README.md           # Project documentation
└── public/             # Static files served by Nginx
    ├── index.html      # Login page
    ├── profile.html    # Dashboard page
    ├── css/
    │   └── style.css   # Application styles
    ├── js/
    │   ├── script.js   # Login authentication logic
    │   └── profile.js  # Dashboard functionality
    └── test/
        └── graphiql.html  # GraphQL API testing interface
```

## Getting Started

1. Clone the repository
2. Build the Docker image:
```sh
docker build -t graphql-dashboard .
```

3. Run the container:
```sh
docker run -p 8081:8081 graphql-dashboard
```

4. Access the application at `http://localhost:8081`

## Development

- The application uses Basic Authentication for initial login
- JWT tokens are stored in localStorage for subsequent API calls
- The GraphQL endpoint is accessed at `https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql`
- GraphiQL interface is available at `/test/graphiql.html` for API testing

## Security Features

- JWT-based authentication
- Secure headers configured in Nginx
- HTTPS ready
- XSS protection headers
- Content Security Policy

## Live Demo

https://zone01profile.netlify.app/