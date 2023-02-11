# node-js-backend-coding-challenge


<h2>Background</h2>
The implemention of NodeJS-backend-challenge. Open the link to see the details of the requirements https://github.com/guardrailsio/NodeJS-backend-challenge

<br/>

<h2>Analysis</h2>

1. There should be web service api interface that allows the user to trigger repository scan.

2. Provide an api interface to allow the user to view the scan result

3. When a user request to trigger a repository scan, the user should not wait for the scan result as the scan process can take long time. Therefore, the process will be
  * The system receives the scan repository request from the user.
  * Add the request into the database
  * Submit the request to a queue waiting for the background process to pick up and process.
  * Response the user with http status of 200 and data including the scan id so that the user can use the scan id to get the result.

4. There should be a background process to listen and acknowledge the message in the queue.

5. Once the a new message is detect, a process to scan the repository should start.

6. Update the status and other information into the database.

7. For the simplicity of implementation now, retry process when an error occurs is skipped.

<h2>Solution Design</h2>
The solution of the service includes 2 parts

1. web-api-service
Web api service that allows the users to trigger scan event by passing repository name and view a scan result by a scan id. This service only receives the requests from the user and put the request into the queue system. In this particular instance, it will be redis.

2. code-scan-process-service
Background service that runs when a message is added into the queue. Once a message in the queue is detected, a process will invoke the detect the vulnerabilities in the repository and store the result into the database. If any error occurs during the process, the process is added back to the queue to re-run again.

3. Please see Guard Rails.pptx for the architecture design and environment variables

<br/>

<h2>Tools</h2>
The tools are selected based on the criteria of

1. Free to use for a small project
2. Easy and fast to setup
3. A cloud platform that can provide Queue system and database. For the instance https://render.com/ can server the purpose

4. Redis - For pub/sub implementation
5. Postgress - Store the scan result information

<br/>

<h2>Local development</h2>
Steps to run and develop the application on a local machine

<br/>
<h3>Machine preparation</h3>

1. install nodejs from https://nodejs.org/en/

2. Option 1 Run database and redis on local machine
  
  * 2.1 (optional) install docker from https://www.docker.com/
  * 2.2. run redis on local machine you can start redis from docker by running the command

  ```
  docker run -p 6379:6379 -it redis/redis-stack-server:latest
  ```
  * 2.3 run 
  ```
  docker run --name code-challenge-db-gr -e POSTGRES_USER=myusername -e POSTGRES_PASSWORD=mypassword -p 5432:5432 
  ```

3. Option 2 use the service on cloud provider such as gcp, render and etc

4. Create database and table. The scripts to create tables are available in misc/sql
 * 1_scan_events.sql
 * 2_scan_events_result.sql

5. change the directory into web-api-service and create .env file. see the example in .env.example

6. run the command
  ```
  npm install
  npm run dev
  ```

7. change the directory into code-scan-process-service and create .env file. see the example in .env.example

8. run the command
  ```
  npm install
  npm run dev
  ```

<h2>Run the application</h2>
Before running the application please ensure that the following items are completed.

1. database connection information

2. database and tables are created

3. redis connection

1. Change the directory into web-api-service and run the command

  ```
  npm build
  npm start
  ```

2. The web service should be running on port 8000
Please see the Swagger section for the detail api or the postman file from
Web Api Service.postman_collection.json


3. Change the directory into code-scan-process-service and run the command

  ```
  npm build
  npm start
  ```


<h2>Swagger</h2>

http://localhost:8000/api-docs

<h2>Commands</h2>

Install dependencies
```
npm install
```
<br/>

Start local service for development
```
npm run dev
```
<br/>

Run unit and integration tests
```
npm run test
```
<br/>

Build the application for production
```
npm run build
```
<br/>

Start the application for production
```
npm run start
```