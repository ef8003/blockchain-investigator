Features

Directed graph visualization of wallet transactions
Dynamic graph expansion — load first N transactions per address
“Load More” pagination per node
Collapsible log window showing every API call
Address details panel that updates on node selection
 Full error handling + loading states
Modular React structure (Context API, Hooks, React Query)
Includes unit tests (Vitest + Testing Library)
Node.js proxy server to bypass CORS limitations of the Blockchain API

Project Structure
blockchain-investigator/
│
├── src/
│   ├── api/
│   │   └── blockchain.js
│   ├── components/
│   │   ├── GraphView.jsx
│   │   ├── LogPanel.jsx
│   │   ├── DetailsPanel.jsx
│   │   ├── SearchBar.jsx
│   │   └── ...
│   ├── hooks/
│   │   └── useWalletGraph.js
│   ├── context/
│   │   └── AppContext.jsx
│   ├── utils/
│   │   └── layout.js
│   └── App.jsx
│
├── server/                 ← Required Node.js proxy server
│   └── index.js
│
└── __tests__/              ← Vitest test suite

Installation & Setup
1. Clone the repository
git clone https://github.com/YOUR_USERNAME/blockchain-investigator.git
cd blockchain-investigator

2. Install dependencies
npm install

3. Start the Backend Proxy (IMPORTANT)

The Blockchain.com Data API does NOT support CORS, so a small Node.js proxy server is required.

Open a separate terminal:

cd server
npm install
node index.js


The proxy will run at:

http://localhost:5000


The frontend uses this endpoint:

GET /api/wallet/:address?limit=2&cursor=<cursor>

4. Start the Frontend Application

In another terminal:

npm run dev


Frontend will run at:

http://localhost:5173


Both servers MUST run simultaneously:

Service	URL
Frontend	http://localhost:5173

Proxy Server	http://localhost:5000
Running Tests

The project includes unit tests for:

LogPanel component

useWalletGraph hook

Run all tests:

npm run test

Technologies Used: 

React 18

Vite

React Query

XYFlow

MUI

Vitest

React Testing Library

Node.js backend proxy

Blockchain.com Data API

Application Behavior: 

🔹 Search a wallet address

Loads the first N transactions for the initial node.

🔹 Click on any node

Fetches and merges additional transactions for that address.

🔹 Load More

Fetches the next page using cursor-based pagination.

🔹 Log Window

Displays every API call (method, URL, params).

🔹 Details Panel

Shows information about the selected wallet/node.

Notes:

Built with modular architecture for easy expansion.

All API calls appear in the log panel.

Tests cover the most important logic flow.

Error handling and loading indicators included throughout the app.
