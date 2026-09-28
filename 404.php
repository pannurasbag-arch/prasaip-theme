<?php
$file = prasa_ip_static_file_for_current_request();
if ($file) {
    status_header(200);
    prasa_ip_render_static($file);
    return;
}
get_header();
?>
<main class="content-page"><div class="wrap"><article class="article"><p class="eyebrow">404</p><h1>Page not found</h1><p>The requested page may have moved. Continue to the homepage or review our intellectual property services.</p><p><a class="button gold" href="<?php echo esc_url(home_url('/')); ?>">Go to homepage</a></p></article></div></main>
<?php get_footer();

