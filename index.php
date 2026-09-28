<?php get_header(); ?>
<main class="content-page"><div class="wrap">
<section class="article"><p class="eyebrow">PRASA IP INSIGHTS</p><h1><?php echo is_archive() ? esc_html(get_the_archive_title()) : 'Insights'; ?></h1></section>
<div class="blog-grid">
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
<article class="blog-card"><h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2><p><?php echo esc_html(wp_trim_words(get_the_excerpt(), 32)); ?></p><a class="card-link" href="<?php the_permalink(); ?>">Read article →</a></article>
<?php endwhile; else : ?><p>No articles found.</p><?php endif; ?>
</div>
<?php the_posts_pagination(); ?>
</div></main>
<?php get_footer();

