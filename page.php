<?php
$file = prasa_ip_static_file_for_current_request();
if ($file) {
    prasa_ip_render_static($file);
    return;
}
prasa_ip_render_legacy_singular();
