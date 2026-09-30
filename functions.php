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
