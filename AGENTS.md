This is a project to create a web-based Monero wallet.

## Development Instructions

1.  Use vanilla JavaScript, HTML, and CSS.
2.  All JavaScript code should be in the `app.js` file.
3.  All CSS code should be in the `style.css` file.
4.  The main HTML file is `index.html`.
5.  Use the Monero RPC documentation for interacting with the remote node: https://www.getmonero.org/resources/developer-guides/daemon-rpc.html
6.  For cryptography, consider using the `monero-javascript` library. I will need to investigate this library further.
7.  The wallet should be able to connect to a remote node, but the user should be able to change the node address. For now, I will use `node.xmr.pt:18081` as the default.
