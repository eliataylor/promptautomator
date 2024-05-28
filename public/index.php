<?php

function serveIndexIfValidKey() {
    // Get the 'key' query parameter from the URL
    if (!isset($_GET['key'])) {
        http_response_code(403); // Forbidden
        echo "Access denied.";
        return;
    }

    $key = $_GET['key'];

    // Check if the key is a valid timestamp
    if (!is_numeric($key) || strlen($key) != 10) {
        http_response_code(403); // Forbidden
        echo "Invalid key.";
        return;
    }

    // Get the current time
    $currentTime = time();

    // Calculate the time difference
    $timeDifference = abs($currentTime - (int)$key);

    // Check if the time difference is within 5000 seconds
    if ($timeDifference <= 5000) {
        // Serve the index.html file
        if (file_exists('index.html')) {
            readfile('index.html');
        } else {
            http_response_code(404); // Not Found
            echo "index.html not found.";
        }
    } else {
        http_response_code(403); // Forbidden
        echo "Link expired. Ask me for a new one.";
    }
}

// Call the function to check the key and serve the file if valid
serveIndexIfValidKey();

?>
