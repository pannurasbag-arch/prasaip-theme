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

// GA4 loads only after the visitor accepts analytics cookies (choice kept in localStorage).
function prasa_ip_ga4_tag() {
    $measurement_id = 'G-YEV19GLG18';
    printf(
        '<script>window.prasaGA=function(){if(window.prasaGALoaded)return;window.prasaGALoaded=1;var s=document.createElement("script");s.async=1;s.src="https://www.googletagmanager.com/gtag/js?id=%1$s";document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};gtag("js",new Date());gtag("config","%1$s",{anonymize_ip:true});};try{if(localStorage.getItem("prasa_cookie_consent")==="granted")prasaGA();}catch(e){}</script>' . "\n",
        esc_attr($measurement_id)
    );
}
add_action('wp_head', 'prasa_ip_ga4_tag', 20);

// Cookie notice: shown until the visitor accepts or declines. Any element with
// data-cookie-settings reopens it (used on the privacy policy page).
function prasa_ip_cookie_notice() {
    ?>
<div class="pc-consent" id="pc-consent" role="region" aria-label="Cookie notice" hidden>
  <p>Analytics cookies are used only if you accept. <a href="/privacy-policy/">Privacy</a></p>
  <div class="pc-consent__btns"><button type="button" data-pc="decline">Decline</button><button type="button" data-pc="accept">Accept</button></div>
</div>
<button type="button" class="pc-pill" id="pc-pill" data-cookie-settings hidden>Cookies</button>
<style>
.pc-consent{position:fixed;left:16px;bottom:16px;z-index:9999;max-width:min(400px,calc(100vw - 32px));display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 12px 10px 14px;background:#2a0a1b;color:#fffbf2;border:1px solid rgba(227,196,107,.45);border-radius:12px;box-shadow:0 10px 26px rgba(20,4,12,.3);font:13px/1.45 "DM Sans",Arial,sans-serif}
.pc-consent[hidden],.pc-pill[hidden]{display:none}
.pc-consent p{flex:1 1 180px;margin:0;color:#fffbf2}
.pc-consent a{color:#f1d486;text-decoration:underline}
.pc-consent__btns{display:flex;gap:8px}
.pc-consent button,.pc-pill{min-height:36px;padding:0 14px;border-radius:999px;font:600 13px/1 "DM Sans",Arial,sans-serif;cursor:pointer;border:1px solid #e3c46b}
.pc-consent [data-pc="decline"]{background:transparent;color:#fffbf2}
.pc-consent [data-pc="accept"]{background:#e3c46b;color:#2a0a1b}
.pc-pill{position:fixed;left:16px;bottom:16px;z-index:9999;background:#2a0a1b;color:#f1d486;opacity:.85}
.pc-consent button:focus-visible,.pc-pill:focus-visible{outline:2px solid #fffbf2;outline-offset:2px}
@media (max-width:600px){.pc-consent,.pc-pill{left:10px;bottom:10px}.pc-consent{max-width:calc(100vw - 86px)}}
</style>
<script>
(function(){var b=document.getElementById('pc-consent'),p=document.getElementById('pc-pill');if(!b)return;var k='prasa_cookie_consent',v=null,m=null;try{v=localStorage.getItem(k);m=sessionStorage.getItem('prasa_cookie_min');}catch(e){}
function mini(){b.hidden=true;if(p)p.hidden=false;try{sessionStorage.setItem('prasa_cookie_min','1');}catch(e){}}
if(!v){if(m){if(p)p.hidden=false;}else{b.hidden=false;setTimeout(function(){if(!b.hidden)mini();},60000);}}
b.addEventListener('click',function(e){var a=e.target.getAttribute&&e.target.getAttribute('data-pc');if(!a)return;try{localStorage.setItem(k,a==='accept'?'granted':'denied');}catch(x){}b.hidden=true;if(p)p.hidden=true;if(a==='accept'&&window.prasaGA)prasaGA();});
document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-cookie-settings]');if(t){e.preventDefault();b.hidden=false;if(p)p.hidden=true;}});})();
</script>
<?php
}
add_action('wp_footer', 'prasa_ip_cookie_notice', 50);

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

// Slow down password guessing: after 10 failed logins for one username from one IP,
// refuse that username from that IP for 15 minutes. Keying on username as well as IP
// means a bot behind a shared CDN address cannot lock out other people's accounts.
function prasa_ip_login_key($username) {
    $ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
    $name = strtolower(trim((string) $username));
    return 'prasa_ip_login_fail_' . md5($ip . '|' . $name);
}
add_action('wp_login_failed', function ($username) {
    $key = prasa_ip_login_key($username);
    $count = (int) get_transient($key);
    set_transient($key, $count + 1, 15 * MINUTE_IN_SECONDS);
});
add_filter('authenticate', function ($user, $username = '') {
    if ($username !== '' && (int) get_transient(prasa_ip_login_key($username)) >= 10) {
        return new WP_Error('too_many_attempts', 'Too many failed login attempts. Please try again in 15 minutes.');
    }
    return $user;
}, 30, 2);
add_action('wp_login', function ($user_login) {
    delete_transient(prasa_ip_login_key($user_login));
});

/* ---------- Search engines and AI answers (2026-10-20) ---------- */

// IndexNow key file (https://www.prasaip.com/<key>.txt) so Bing and others accept change pings.
add_action('init', function () {
    $key = 'f1f4c68906784923a503ba35cbbdc26c';
    $path = isset($_SERVER['REQUEST_URI']) ? (string) wp_parse_url(wp_unslash($_SERVER['REQUEST_URI']), PHP_URL_PATH) : '';
    if ($path === '/' . $key . '.txt') {
        status_header(200);
        header('Content-Type: text/plain; charset=utf-8');
        echo $key;
        exit;
    }
}, 0);

/* llms.txt: plain-text summary of the firm for AI tools, served from the theme. */ add_action('init', function () { $path = isset($_SERVER['REQUEST_URI']) ? (string) wp_parse_url(wp_unslash($_SERVER['REQUEST_URI']), PHP_URL_PATH) : ''; $file = get_template_directory() . '/static/llms.txt'; if ($path === '/llms.txt' && is_readable($file)) { status_header(200); header('Content-Type: text/plain; charset=utf-8'); readfile($file); exit; } }, 0); // Merge duplicate pages: older "choosing a lawyer in Bengaluru" pages point to the current Bengaluru page.
add_action('template_redirect', function () {
    $path = isset($_SERVER['REQUEST_URI']) ? trim((string) wp_parse_url(wp_unslash($_SERVER['REQUEST_URI']), PHP_URL_PATH), '/') : '';
    $old = array('choose-the-best-patent-attorney-in-bangalore');
    if (in_array($path, $old, true)) {
        wp_safe_redirect(home_url('/ip-law-firm-bengaluru/'), 301);
        exit;
    }
}, 1);

// IndexNow: after each deploy, tell Bing and other IndexNow engines which pages were added or changed.
// Compares a hash of every static page with the last deploy; the first run only records the hashes.
function prasa_ip_indexnow_on_new_build() {
    $fingerprint = prasa_ip_theme_fingerprint();
    if (get_option('prasa_ip_indexnow_fp') === $fingerprint) {
        return;
    }
    // One request handles a deploy; others skip while it runs.
    if (get_transient('prasa_ip_indexnow_lock')) {
        return;
    }
    set_transient('prasa_ip_indexnow_lock', 1, MINUTE_IN_SECONDS);
    update_option('prasa_ip_indexnow_fp', $fingerprint, false);

    $dir = get_template_directory() . '/static/';
    $pages = array('' => 'index.html') + prasa_ip_static_map();
    $old = get_option('prasa_ip_indexnow_hashes', null);
    $new = array();
    $changed = array();
    foreach ($pages as $slug => $file) {
        if (!is_readable($dir . $file)) {
            continue;
        }
        $hash = md5_file($dir . $file);
        $new[$slug] = $hash;
        if (is_array($old) && (!isset($old[$slug]) || $old[$slug] !== $hash)) {
            $changed[] = home_url('/' . ($slug === '' ? '' : $slug . '/'));
        }
    }
    update_option('prasa_ip_indexnow_hashes', $new, false);
    if (!is_array($old) || !$changed) {
        return;
    }
    $key = 'f1f4c68906784923a503ba35cbbdc26c';
    $host = wp_parse_url(home_url('/'), PHP_URL_HOST);
    wp_remote_post('https://api.indexnow.org/indexnow', array(
        'blocking' => false,
        'timeout'  => 3,
        'headers'  => array('Content-Type' => 'application/json; charset=utf-8'),
        'body'     => wp_json_encode(array(
            'host'        => $host,
            'key'         => $key,
            'keyLocation' => home_url('/' . $key . '.txt'),
            'urlList'     => array_slice($changed, 0, 1000),
        )),
    ));
}
add_action('wp_loaded', 'prasa_ip_indexnow_on_new_build', 20);
