<?php
if (!defined('ABSPATH')) {
    exit;
}

require_once get_template_directory() . '/render-static.php';
require_once get_template_directory() . '/render-legacy.php';

function prasa_ip_setup() {
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script'));
}
add_action('after_setup_theme', 'prasa_ip_setup');

// Send page views to the PRASA IP GA4 web stream across static and WordPress routes.
function prasa_ip_ga4_tag() {
    $measurement_id = 'G-YEV19GLG18';
    printf(
        '<script async src="https://www.googletagmanager.com/gtag/js?id=%1$s"></script>' . "\n" .
        '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","%1$s");</script>' . "\n",
        esc_attr($measurement_id)
    );
}
add_action('wp_head', 'prasa_ip_ga4_tag', 20);

function prasa_ip_assets() {
    // Static and legacy renders link the stylesheet and script themselves.
    if (prasa_ip_static_file_for_current_request() || prasa_ip_is_legacy_request()) {
        return;
    }
    wp_enqueue_style('prasa-ip-static', get_template_directory_uri() . '/static/styles.css', array(), '1.0.0');
    wp_enqueue_script('prasa-ip-static', get_template_directory_uri() . '/static/script.js', array(), '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'prasa_ip_assets');

/**
 * The former Elementor site remains installed for rollback and for legacy
 * content, but its front-end bundles are not required by the redesigned
 * static routes. Removing them here avoids CSS conflicts, unnecessary page
 * weight and Elementor initialization errors without deactivating plugins.
 */
function prasa_ip_remove_legacy_builder_assets() {
    if (!prasa_ip_static_file_for_current_request() && !prasa_ip_is_legacy_request()) {
        return;
    }

    $asset_markers = array(
        '/plugins/elementor/',
        '/plugins/elementskit-lite/',
        '/plugins/metform/',
        '/plugins/header-footer-elementor/',
        '/plugins/tecz-core/',
        '/plugins/wp-custom-cursors/',
        '/uploads/elementor/',
    );

    global $wp_scripts, $wp_styles;
    if ($wp_scripts instanceof WP_Scripts) {
        foreach ((array) $wp_scripts->queue as $handle) {
            $src = isset($wp_scripts->registered[$handle]) ? (string) $wp_scripts->registered[$handle]->src : '';
            foreach ($asset_markers as $marker) {
                if ($src && strpos($src, $marker) !== false) {
                    wp_dequeue_script($handle);
                    break;
                }
            }
        }
    }
    if ($wp_styles instanceof WP_Styles) {
        foreach ((array) $wp_styles->queue as $handle) {
            $src = isset($wp_styles->registered[$handle]) ? (string) $wp_styles->registered[$handle]->src : '';
            foreach ($asset_markers as $marker) {
                if ($src && strpos($src, $marker) !== false) {
                    wp_dequeue_style($handle);
                    break;
                }
            }
        }
    }
}
add_action('wp_enqueue_scripts', 'prasa_ip_remove_legacy_builder_assets', PHP_INT_MAX);
add_action('wp_head', 'prasa_ip_remove_legacy_builder_assets', 1);
add_action('wp_footer', 'prasa_ip_remove_legacy_builder_assets', 0);

function prasa_ip_seed_content() {
    $pages = array(
        'ip-law-firm-bengaluru' => array('IP Law Firm in Bengaluru', 'ip-law-firm-bengaluru.html'),
        'patent-services' => array('Patent Services', 'patent-services.html'),
        'trademark-services' => array('Trademark Services', 'trademark-services.html'),
        'additional-ip-services' => array('Additional IP Services', 'additional-ip-services.html'),
        'legal-business-services' => array('Legal and Business Services', 'legal-business-services.html'),
        'international-patent-support' => array('International Patent Support', 'international-patent-support.html'),
        'technology-sectors' => array('Technology Sectors', 'technology-sectors.html'),
        'professionals' => array('Professionals', 'professionals.html'),
        'knowledge-centre' => array('Knowledge Centre', 'knowledge-centre.html'),
        'experience' => array('Experience', 'experience.html'),
        'about-us' => array('About PRASA IP', 'firm.html'),
        'careers' => array('Careers', 'careers.html'),
        'privacy-policy' => array('Privacy Policy', 'privacy-policy.html'),
        'terms-of-use' => array('Terms of Use', 'terms-of-use.html'),
        'disclaimer' => array('Disclaimer', 'disclaimer.html'),
    );

    foreach ($pages as $slug => $data) {
        if (get_page_by_path($slug, OBJECT, 'page')) {
            continue;
        }
        wp_insert_post(array(
            'post_title' => $data[0],
            'post_name' => $slug,
            'post_type' => 'page',
            'post_status' => 'publish',
            'post_content' => prasa_ip_extract_static_content($data[1], 'main'),
        ));
    }

    $articles = array(
        'recentive-ai-patent-eligibility' => array('Recentive v Fox: AI Patent Eligibility Lessons', 'recentive-ai-patent-eligibility.html'),
        'epo-g1-24-claim-interpretation' => array('EPO G 1/24: Claim Interpretation and Drafting Lessons', 'epo-g1-24-claim-interpretation.html'),
        'india-patent-rules-2026' => array('India Patent Rules 2026: Filing Review', 'india-patent-rules-2026.html'),
        'india-trademark-ekyc-2026' => array('India Trademark eKYC in 2026', 'india-trademark-ekyc-2026.html'),
        'us-ai-patent-inventorship-2026' => array('US AI Patent Inventorship Guidance 2026', 'us-ai-patent-inventorship-2026.html'),
        'us-patent-eligibility-declarations' => array('US Patent Eligibility Declarations', 'us-patent-eligibility-declarations.html'),
        'euipo-trademark-design-changes-2026' => array('EU Trade Mark and Design Practice in 2026', 'euipo-trademark-design-changes-2026.html'),
    );

    $category = term_exists('IP Insights', 'category');
    if (!$category) {
        $category = wp_insert_term('IP Insights', 'category', array('slug' => 'ip-insights'));
    }
    $category_id = is_array($category) ? (int) $category['term_id'] : 0;

    foreach ($articles as $slug => $data) {
        if (get_page_by_path($slug, OBJECT, array('post', 'page'))) {
            continue;
        }
        wp_insert_post(array(
            'post_title' => $data[0],
            'post_name' => $slug,
            'post_type' => 'post',
            'post_status' => 'publish',
            'post_category' => $category_id ? array($category_id) : array(),
            'post_content' => prasa_ip_extract_static_content($data[1], 'article'),
        ));
    }

    $home = get_page_by_path('home');
    if ($home) {
        update_option('show_on_front', 'page');
        update_option('page_on_front', (int) $home->ID);
    }
    flush_rewrite_rules();
}
add_action('after_switch_theme', 'prasa_ip_seed_content');

/**
 * Comments and pingbacks are closed site wide to stop spam. The redesigned
 * pages have no comment feature, but older posts still accepted submissions
 * through wp-comments-post.php, XML-RPC and the REST API. Existing comments
 * stay in the database and remain manageable on the admin Comments screen;
 * they are only hidden from the public front end.
 */
add_filter('comments_open', '__return_false', 20);
add_filter('pings_open', '__return_false', 20);

// Hide stored comments from public templates. The admin screens still list them.
function prasa_ip_hide_front_end_comments($comments) {
    return is_admin() ? $comments : array();
}
add_filter('comments_array', 'prasa_ip_hide_front_end_comments', 20);

function prasa_ip_remove_comment_support() {
    foreach (array('post', 'page') as $post_type) {
        remove_post_type_support($post_type, 'comments');
        remove_post_type_support($post_type, 'trackbacks');
    }
}
add_action('init', 'prasa_ip_remove_comment_support', 100);

// Disable XML-RPC pingbacks and stop advertising the pingback endpoint.
add_filter('xmlrpc_methods', function ($methods) {
    unset($methods['pingback.ping'], $methods['pingback.extensions.getPingbacks']);
    return $methods;
});
add_filter('wp_headers', function ($headers) {
    unset($headers['X-Pingback']);
    return $headers;
});

// Refuse direct submissions to wp-comments-post.php before anything is stored.
function prasa_ip_block_comment_submission() {
    wp_die('Comments are closed.', '', array('response' => 403));
}
add_action('pre_comment_on_post', 'prasa_ip_block_comment_submission');

// Drop the comments feed link from the head and answer comment feed requests with a 404.
add_filter('feed_links_show_comments_feed', '__return_false');
function prasa_ip_block_comment_feed() {
    if (!is_comment_feed()) {
        return;
    }
    global $wp_query;
    $wp_query->set_404();
    status_header(404);
    nocache_headers();
}
add_action('template_redirect', 'prasa_ip_block_comment_feed', 1);

// Remove the public REST comment endpoints. Logged-in users keep them for moderation tools.
add_filter('rest_endpoints', function ($endpoints) {
    if (!is_user_logged_in()) {
        unset($endpoints['/wp/v2/comments'], $endpoints['/wp/v2/comments/(?P<id>[\d]+)']);
    }
    return $endpoints;
});

// Keep the Rank Math WebSite name readable in JSON-LD and provide the short brand name.
add_filter('rank_math/json_ld', function ($data) {
    foreach ($data as &$node) {
        if (!is_array($node) || !isset($node['@type']) || $node['@type'] !== 'WebSite') {
            continue;
        }
        $node['name'] = 'PRASA IP (IP ATTORNEYS & ADVOCATES)';
        $node['alternateName'] = 'PRASA IP';
    }
    unset($node);
    return $data;
}, 99);

// Remove leftover builder font and icon stylesheets at print time on redesigned routes.
add_filter('print_styles_array', function ($handles) {
    if (is_admin() || (!prasa_ip_static_file_for_current_request() && !prasa_ip_is_legacy_request())) {
        return $handles;
    }
    global $wp_styles;
    $markers = array('/plugins/elementor/', '/plugins/elementskit-lite/', '/plugins/metform/', '/plugins/header-footer-elementor/', '/plugins/tecz-core/', '/plugins/wp-custom-cursors/', '/uploads/elementor/');
    return array_values(array_filter((array) $handles, function ($handle) use ($wp_styles, $markers) {
        $src = isset($wp_styles->registered[$handle]) ? (string) $wp_styles->registered[$handle]->src : '';
        foreach ($markers as $marker) {
            if ($src && strpos($src, $marker) !== false) {
                return false;
            }
        }
        return true;
    }));
}, PHP_INT_MAX);

// Purge the LiteSpeed page cache once whenever a new theme build lands on the server.
// The fingerprint covers the theme's PHP files and the static pages, scripts and styles,
// so any deploy (a new article, a version bump) clears stale cached pages by itself.
// Runs only on uncached requests, since LiteSpeed serves cache hits without PHP.
function prasa_ip_theme_fingerprint() {
    $dir = get_template_directory();
    $files = array_merge(
        glob($dir . '/*.php') ?: array(),
        glob($dir . '/static/*.{html,js,css}', GLOB_BRACE) ?: array()
    );
    sort($files);
    $parts = array();
    foreach ($files as $file) {
        $parts[] = basename($file) . ':' . filesize($file) . ':' . filemtime($file);
    }
    return md5(implode('|', $parts));
}

function prasa_ip_purge_cache_on_new_build() {
    if (!has_action('litespeed_purge_all')) {
        return;
    }
    $fingerprint = prasa_ip_theme_fingerprint();
    if (get_option('prasa_ip_build_fingerprint') === $fingerprint) {
        return;
    }
    update_option('prasa_ip_build_fingerprint', $fingerprint, false);
    do_action('litespeed_purge_all', 'PRASA IP theme build changed');
}
add_action('wp_loaded', 'prasa_ip_purge_cache_on_new_build');

/* ---------- Security hardening (2026-10-19) ---------- */

// Browser security headers on every front-end response.
function prasa_ip_security_headers() {
    if (is_admin() || headers_sent()) {
        return;
    }
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    if (is_ssl()) {
        header('Strict-Transport-Security: max-age=31536000');
    }
}
add_action('send_headers', 'prasa_ip_security_headers');

// Do not advertise the WordPress version.
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');

// Stop username discovery: no public user list in the REST API, no ?author=N lookups.
add_filter('rest_endpoints', function ($endpoints) {
    if (!is_user_logged_in()) {
        unset($endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    }
    return $endpoints;
});
add_action('template_redirect', function () {
    if (!is_user_logged_in() && (is_author() || isset($_GET['author']))) {
        wp_safe_redirect(home_url('/'), 301);
        exit;
    }
}, 0);

// XML-RPC is not used by this site; switch off its login methods.
add_filter('xmlrpc_enabled', '__return_false');

// Same message for a wrong username or a wrong password.
add_filter('login_errors', function () {
    return 'Incorrect login details.';
});

// Slow down password guessing: after 10 failed logins from one IP, refuse logins from it for 15 minutes.
function prasa_ip_login_key() {
    $ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
    return 'prasa_ip_login_fail_' . md5($ip);
}
add_action('wp_login_failed', function () {
    $key = prasa_ip_login_key();
    $count = (int) get_transient($key);
    set_transient($key, $count + 1, 15 * MINUTE_IN_SECONDS);
});
add_filter('authenticate', function ($user) {
    if ((int) get_transient(prasa_ip_login_key()) >= 10) {
        return new WP_Error('too_many_attempts', 'Too many failed login attempts. Please try again in 15 minutes.');
    }
    return $user;
}, 30);
add_action('wp_login', function () {
    delete_transient(prasa_ip_login_key());
});
