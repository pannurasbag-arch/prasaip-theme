<?php
if (!defined('ABSPATH')) {
    exit;
}

/*
 * Older WordPress posts and pages were built with Elementor and its header and
 * footer templates. They are rendered here with the same shell as the static
 * pages, so every URL on the site shares one design. The Elementor data stays
 * in the database untouched, so this can be reverted by removing this file.
 */

function prasa_ip_is_legacy_request() {
    if (is_admin() || isset($_GET['elementor-preview']) || isset($_GET['preview'])) {
        return false;
    }
    if (prasa_ip_static_file_for_current_request()) {
        return false;
    }
    return is_singular() || is_archive() || is_home() || is_search() || is_404();
}

/** Header and footer markup taken from a static page, with links rewritten. */
function prasa_ip_shell_parts() {
    static $parts = null;
    if ($parts !== null) {
        return $parts;
    }
    $path = get_template_directory() . '/static/knowledge-centre.html';
    $raw = is_readable($path) ? file_get_contents($path) : '';
    $html = prasa_ip_transform_static_html($raw);
    $head_links = '';
    if (preg_match('/<link rel="preconnect".*?<link[^>]+display=swap[^>]*>/s', $html, $m)) {
        $head_links .= $m[0];
    }
    if (preg_match('/<link rel="stylesheet"[^>]+styles\.css[^>]*>/', $html, $m)) {
        $head_links .= $m[0];
    }
    if (preg_match('/<link rel="icon"[^>]*>/', $html, $m)) {
        $head_links .= $m[0];
    }
    $top = '';
    if (preg_match('/<body[^>]*>(.*?)<main>/s', $html, $m)) {
        $top = $m[1];
    }
    $bottom = '';
    if (preg_match('/<\/main>(.*)<\/body>/s', $html, $m)) {
        $bottom = $m[1];
    }
    $parts = array('head' => $head_links, 'top' => $top, 'bottom' => $bottom);
    return $parts;
}

/** Clean article HTML from a builder post, keeping only editorial markup. */
function prasa_ip_clean_legacy_content($post) {
    $source = (string) $post->post_content;
    $text_len = strlen(trim(wp_strip_all_tags($source)));
    if ($text_len < 400 || strpos($source, 'data-elementor') !== false) {
        // Fall back to the rendered content when the stored copy is missing or builder markup.
        $rendered = apply_filters('the_content', $source);
        if (strlen(trim(wp_strip_all_tags($rendered))) > $text_len) {
            $source = $rendered;
        }
    }
    // Remove widgets that are not part of the article body.
    $source = preg_replace('#<(script|style|form|nav|svg|iframe|noscript|button)[^>]*>.*?</\1\s*>#is', '', $source);
    $source = preg_replace('#<div[^>]+elementor-widget-(?:page-title|hfe-breadcrumbs-widget|social-icons|share-buttons|post-navigation|posts|form|metform|icon-list)[^>]*>.*?</div>\s*</div>#is', '', $source);
    $allowed = array(
        'p' => array(), 'br' => array(), 'strong' => array(), 'b' => array(), 'em' => array(), 'i' => array(),
        'h2' => array(), 'h3' => array(), 'h4' => array(), 'ul' => array(), 'ol' => array(), 'li' => array(),
        'blockquote' => array(), 'table' => array(), 'thead' => array(), 'tbody' => array(), 'tr' => array(),
        'th' => array(), 'td' => array(), 'figure' => array(), 'figcaption' => array(),
        'a' => array('href' => true, 'title' => true),
        'img' => array('src' => true, 'alt' => true, 'width' => true, 'height' => true),
    );
    $source = preg_replace('#<h1[^>]*>#i', '<h2>', $source);
    $source = preg_replace('#</h1\s*>#i', '</h2>', $source);
    $clean = wp_kses($source, $allowed);
    $clean = wpautop($clean);
    // Drop a repeated title heading and empty elements left behind by the builder.
    $title = trim(wp_strip_all_tags(get_the_title($post)));
    $clean = preg_replace_callback('#<h2>(.*?)</h2>#s', function ($m) use ($title) {
        $inner = trim(html_entity_decode(wp_strip_all_tags($m[1]), ENT_QUOTES, 'UTF-8'));
        return ($inner === '' || strcasecmp($inner, html_entity_decode($title, ENT_QUOTES, 'UTF-8')) === 0) ? '' : '<h2>' . $inner . '</h2>';
    }, $clean);
    $clean = preg_replace('#<(p|li|h3|h4|strong|b)>\s*(&nbsp;)?\s*</\1>#', '', $clean);
    $clean = preg_replace('#<img(?![^>]*loading=)#', '<img loading="lazy" decoding="async"', $clean);
    return trim($clean);
}

function prasa_ip_legacy_header() {
    $parts = prasa_ip_shell_parts();
    $GLOBALS['prasa_ip_legacy_render'] = true;
    echo '<!doctype html><html ' . get_language_attributes() . '><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
    echo '<title>' . esc_html(wp_get_document_title()) . '</title>';
    echo $parts['head']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    wp_head();
    echo '</head><body class="' . esc_attr(implode(' ', get_body_class('prasa-legacy'))) . '">';
    wp_body_open();
    echo $parts['top']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

function prasa_ip_legacy_footer() {
    $parts = prasa_ip_shell_parts();
    echo $parts['bottom']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    wp_footer();
    echo '</body></html>';
}

function prasa_ip_render_legacy_singular() {
    $post = get_queried_object();
    $home = trailingslashit(home_url('/'));
    $is_post = ($post instanceof WP_Post) && $post->post_type === 'post';
    prasa_ip_legacy_header();
    $title = get_the_title($post);
    $content = prasa_ip_clean_legacy_content($post);
    $published = get_the_date('j F Y', $post);
    $modified = get_the_modified_date('j F Y', $post);
    $crumb = $is_post ? '<a href="' . esc_url($home . 'knowledge-centre/') . '">Insights</a> / Article' : '<a href="' . esc_url($home) . '">Home</a> / ' . esc_html($title);
    echo '<main><section class="page-hero page-hero--insights"><div class="wrap"><p class="breadcrumbs">' . $crumb . '</p>';
    echo '<p class="eyebrow pale">' . ($is_post ? 'PRASA IP INSIGHTS' : 'PRASA IP') . '</p><h1>' . esc_html($title) . '</h1></div></section>';
    echo '<section class="content-page"><div class="wrap content-grid"><article class="article legacy-article">';
    if ($is_post) {
        echo '<div class="article-meta"><span>Published ' . esc_html($published) . '</span>';
        if ($modified && $modified !== $published) {
            echo '<span>Updated ' . esc_html($modified) . '</span>';
        }
        echo '<span>PRASA IP</span></div>';
        echo '<p class="note legacy-note">This article was first published on our earlier website. For current law and practice, see our <a href="' . esc_url($home . 'knowledge-centre/') . '">Knowledge Centre</a>.</p>';
    }
    echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    echo '</article><aside class="sidebar"><h2>Related services</h2>';
    echo '<a href="' . esc_url($home . 'patent-services/') . '">Patent services</a>';
    echo '<a href="' . esc_url($home . 'trademark-services/') . '">Trade mark services</a>';
    echo '<a href="' . esc_url($home . 'patent-filing-procedure-in-india-step-by-step-guide/') . '">How to file a patent in India</a>';
    echo '<a href="' . esc_url($home . 'types-of-intellectual-property-protection/') . '">Types of intellectual property</a>';
    echo '<a class="button gold" href="' . esc_url($home . '#contact') . '">Discuss your matter</a></aside></div></section></main>';
    prasa_ip_legacy_footer();
}

// Route builder templates for posts and pages to the theme's own renderer.
add_filter('template_include', function ($template) {
    if (!prasa_ip_is_legacy_request()) {
        return $template;
    }
    if (is_singular()) {
        return get_template_directory() . '/single.php';
    }
    if (is_404()) {
        return get_template_directory() . '/404.php';
    }
    return get_template_directory() . '/index.php';
}, PHP_INT_MAX - 1);
