<?php
prasa_ip_legacy_header();
if (is_search()) {
    $heading = 'Search results for “' . get_search_query() . '”';
    $eyebrow = 'SEARCH';
} elseif (is_category() || is_tag() || is_tax()) {
    $heading = single_term_title('', false);
    $eyebrow = 'PRASA IP INSIGHTS · TOPIC';
} elseif (is_author()) {
    $heading = 'Articles by ' . get_the_author_meta('display_name', (int) get_query_var('author'));
    $eyebrow = 'PRASA IP INSIGHTS';
} elseif (is_archive()) {
    $heading = wp_strip_all_tags(get_the_archive_title());
    $eyebrow = 'PRASA IP INSIGHTS';
} else {
    $heading = 'Insights';
    $eyebrow = 'PRASA IP INSIGHTS';
}
$home = trailingslashit(home_url('/'));
?>
<main><section class="page-hero page-hero--insights"><div class="wrap"><p class="breadcrumbs"><a href="<?php echo esc_url($home . 'knowledge-centre/'); ?>">Insights</a> / <?php echo esc_html($heading); ?></p><p class="eyebrow pale"><?php echo esc_html($eyebrow); ?></p><h1><?php echo esc_html($heading); ?></h1><p>For current analysis of new cases, rules and practice, start with our <a href="<?php echo esc_url($home . 'knowledge-centre/'); ?>" style="color:#f1d486;text-decoration:underline">Knowledge Centre</a>.</p></div></section>
<section class="content-page"><div class="wrap"><div class="blog-grid">
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
<article class="blog-card"><p class="eyebrow"><?php echo esc_html(get_the_date('j F Y')); ?></p><h3><a href="<?php the_permalink(); ?>"><?php echo esc_html(wp_strip_all_tags(get_the_title())); ?></a></h3><p><?php echo esc_html(wp_trim_words(wp_strip_all_tags(get_the_excerpt()), 32)); ?></p><a class="card-link" href="<?php the_permalink(); ?>">Read article →</a></article>
<?php endwhile; else : ?><p>No articles found.</p><?php endif; ?>
</div>
<?php the_posts_pagination(); ?>
</div></section></main>
<?php prasa_ip_legacy_footer();
