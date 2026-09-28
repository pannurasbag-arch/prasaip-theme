<?php
if (!defined('ABSPATH')) {
    exit;
}

function prasa_ip_static_map() {
    return array(
        'ip-law-firm-bengaluru' => 'ip-law-firm-bengaluru.html',
        'patent-services' => 'patent-services.html',
        'trademark-services' => 'trademark-services.html',
        'additional-ip-services' => 'additional-ip-services.html',
        'legal-business-services' => 'legal-business-services.html',
        'international-patent-support' => 'international-patent-support.html',
        'technology-sectors' => 'technology-sectors.html',
        'professionals' => 'professionals.html',
        'knowledge-centre' => 'knowledge-centre.html',
        'experience' => 'experience.html',
        'about-us' => 'firm.html',
        'careers' => 'careers.html',
        'privacy-policy' => 'privacy-policy.html',
        'terms-of-use' => 'terms-of-use.html',
        'disclaimer' => 'disclaimer.html',
        'recentive-ai-patent-eligibility' => 'recentive-ai-patent-eligibility.html',
        'epo-g1-24-claim-interpretation' => 'epo-g1-24-claim-interpretation.html',
        'india-patent-rules-2026' => 'india-patent-rules-2026.html',
        'india-trademark-ekyc-2026' => 'india-trademark-ekyc-2026.html',
        'us-ai-patent-inventorship-2026' => 'us-ai-patent-inventorship-2026.html',
        'us-patent-eligibility-declarations' => 'us-patent-eligibility-declarations.html',
        'euipo-trademark-design-changes-2026' => 'euipo-trademark-design-changes-2026.html',
    );
}

function prasa_ip_static_file_for_current_request() {
    if (is_front_page()) {
        return 'index.html';
    }
    if (is_singular()) {
        $slug = get_post_field('post_name', get_queried_object_id());
        $map = prasa_ip_static_map();
        return isset($map[$slug]) ? $map[$slug] : false;
    }
    return false;
}

function prasa_ip_transform_static_html($html) {
    $base = trailingslashit(get_template_directory_uri()) . 'static/';
    $home = trailingslashit(home_url('/'));
    $html = str_replace(
        array('href="styles.css"', 'src="script.js"', 'href="favicon.svg"', 'src="assets/'),
        array('href="' . esc_url($base . 'styles.css') . '"', 'src="' . esc_url($base . 'script.js?ver=20260928') . '"', 'href="' . esc_url($base . 'favicon.svg') . '"', 'src="' . esc_url($base . 'assets/')),
        $html
    );
    $html = preg_replace_callback('/href="([a-z0-9-]+)\.html(#[^"]*)?"/i', function ($match) use ($home) {
        $slug = $match[1] === 'index' ? '' : ($match[1] === 'firm' ? 'about-us' : $match[1]);
        $fragment = isset($match[2]) ? $match[2] : '';
        return 'href="' . esc_url($home . ($slug ? $slug . '/' : '') . $fragment) . '"';
    }, $html);
    return $html;
}

function prasa_ip_render_static($file) {
    $path = get_template_directory() . '/static/' . basename($file);
    if (!is_readable($path)) {
        status_header(404);
        return;
    }
    add_filter('rank_math/frontend/disable', '__return_true');
    remove_action('wp_head', 'rel_canonical');
    remove_action('wp_head', 'wp_shortlink_wp_head');
    remove_action('wp_head', 'wp_robots', 1);
    $html = prasa_ip_transform_static_html(file_get_contents($path));
    // Identify the publisher in the Article schema with the same logo shown on the site.
    if (strpos($html, '"@type":"Article"') !== false) {
        $publisher = '"publisher":{"@type":"LegalService","name":"PRASA IP"}';
        $logo = esc_url(get_template_directory_uri() . '/static/assets/prasa-ip-logo.webp');
        $site_url = esc_url(home_url('/'));
        $with_logo = '"publisher":{"@type":"LegalService","name":"PRASA IP","url":"' . $site_url . '","logo":{"@type":"ImageObject","url":"' . $logo . '"}}';
        $html = str_replace($publisher, $with_logo, $html);
    }
    // Rank Math supplies these tags. Keep one authoritative set in the rendered head.
    $html = preg_replace('/<meta\\s+(?:name="(?:description|robots|twitter:card)"|property="og:(?:type|title|description|url)")\\s+[^>]*>/i', '', $html);
    $html = preg_replace('/<link\\s+rel="canonical"\\s+[^>]*>/i', '', $html);

    ob_start();
    wp_head();
    $head = ob_get_clean();
    // Rank Math HTML-escapes ampersands even inside its JSON-LD script.
    $head = str_replace('"name":"PRASA IP (IP ATTORNEYS &amp; ADVOCATES)"', '"name":"PRASA IP (IP ATTORNEYS & ADVOCATES)"', $head);
    $html = str_replace('</head>', $head . '</head>', $html);

    ob_start();
    wp_body_open();
    $body_open = ob_get_clean();
    $classes = implode(' ', get_body_class());
    $html = preg_replace('/<body([^>]*)>/', '<body$1 class="' . esc_attr($classes) . '">' . $body_open, $html, 1);

    ob_start();
    wp_footer();
    $footer = ob_get_clean();
    $html = str_replace('</body>', $footer . '</body>', $html);
    echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

function prasa_ip_extract_static_content($file, $element) {
    $path = get_template_directory() . '/static/' . basename($file);
    if (!is_readable($path)) {
        return '';
    }
    $html = prasa_ip_transform_static_html(file_get_contents($path));
    if ($element === 'article' && preg_match('/<article class="article"[^>]*>(.*?)<\/article>/s', $html, $match)) {
        return $match[1];
    }
    if (preg_match('/<main[^>]*>(.*?)<\/main>/s', $html, $match)) {
        return $match[1];
    }
    return '';
}
