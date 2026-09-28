<?php
$file = prasa_ip_static_file_for_current_request();
if ($file) {
    prasa_ip_render_static($file);
    return;
}
get_header();
?>
<main class="content-page"><div class="wrap content-grid"><article class="article">
<?php while (have_posts()) : the_post(); ?>
<p class="eyebrow">PRASA IP INSIGHTS</p>
<h1><?php the_title(); ?></h1>
<div class="article-meta"><span><?php echo esc_html(get_the_date()); ?></span><span>PRASA IP</span></div>
<?php the_content(); ?>
<?php endwhile; ?>
</article></div></main>
<?php get_footer();

