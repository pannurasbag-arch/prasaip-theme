<?php
/**
 * The Patent Brief: newsletter sign up form in the site footer.
 *
 * Sign ups are stored in the WordPress database (option prasa_ip_newsletter_subs),
 * a notice is emailed to the firm, and the list can be viewed and exported under
 * Tools > Patent Brief in the admin area. No third party service is used.
 */
if (!defined('ABSPATH')) {
    exit;
}

const PRASA_IP_NL_OPTION = 'prasa_ip_newsletter_subs';
const PRASA_IP_NL_NOTIFY = 'sanath@prasaip.com';

/** Footer form markup, inserted by prasa_ip_site_footer(). */
function prasa_ip_newsletter_form() {
    $action = esc_url(admin_url('admin-post.php'));
    return '<div class="footer-newsletter" id="patent-brief">'
        . '<div><h2>The Patent Brief</h2>'
        . '<p>A short monthly email on patent and IP developments in India, the US and Europe, with practical notes for IP teams.</p></div>'
        . '<form class="nl-form" method="post" action="' . $action . '">'
        . '<input type="hidden" name="action" value="prasa_ip_subscribe">'
        . '<input type="hidden" name="nl_ts" value="" data-nl-ts>'
        . '<input type="hidden" name="nl_back" value="" data-nl-back>'
        . '<div class="nl-hp" aria-hidden="true"><label>Company website<input type="text" name="nl_website" tabindex="-1" autocomplete="off"></label></div>'
        . '<label class="nl-label" for="nl-email">Email address</label>'
        . '<input id="nl-email" type="email" name="nl_email" required maxlength="190" autocomplete="email" placeholder="you@company.com">'
        . '<label class="nl-label" for="nl-edition">Edition</label>'
        . '<select id="nl-edition" name="nl_edition"><option value="India">India</option><option value="US">US</option><option value="Europe">Europe</option></select>'
        . '<label class="nl-consent"><input type="checkbox" name="nl_consent" value="1" required><span>I agree to receive The Patent Brief by email. I can unsubscribe at any time. See the <a href="privacy-policy.html">privacy policy</a>.</span></label>'
        . '<button type="submit">Subscribe</button>'
        . '<p class="nl-msg" role="status" aria-live="polite" data-nl-msg></p>'
        . '</form>'
        . '<script>(function(){var f=document.querySelector(".nl-form");if(!f)return;var t=f.querySelector("[data-nl-ts]"),b=f.querySelector("[data-nl-back]"),m=f.querySelector("[data-nl-msg]");if(t)t.value=Math.floor(Date.now()/1000);if(b)b.value=location.pathname;var s=new URLSearchParams(location.search).get("nl");var x={ok:"Thank you. You are subscribed to The Patent Brief.",dup:"You are already subscribed. Thank you.",bad:"Please enter a valid email address and tick the consent box.",err:"Sorry, something went wrong. Please email contact@prasaip.com."};if(s&&x[s]&&m){m.textContent=x[s];m.className="nl-msg nl-"+(s==="ok"||s==="dup"?"good":"warn");var w=document.getElementById("patent-brief");if(w)w.scrollIntoView({block:"center"});}})();</script>'
        . '</div>';
}

/** Handle the form post (logged in or not). */
function prasa_ip_newsletter_handle() {
    $back = isset($_POST['nl_back']) ? sanitize_text_field(wp_unslash($_POST['nl_back'])) : '/';
    if ($back === '' || $back[0] !== '/' || strpos($back, '//') === 0) {
        $back = '/';
    }
    $go = function ($code) use ($back) {
        wp_safe_redirect(home_url($back) . '?nl=' . $code . '#patent-brief');
        exit;
    };

    // Spam checks: honeypot field must be empty and the form must have been open for 3 seconds or more.
    $hp = isset($_POST['nl_website']) ? trim((string) wp_unslash($_POST['nl_website'])) : '';
    $ts = isset($_POST['nl_ts']) ? (int) $_POST['nl_ts'] : 0;
    if ($hp !== '' || ($ts > 0 && time() - $ts < 3)) {
        $go('ok');
    }

    // Simple rate limit: 5 sign ups per IP address per hour.
    $ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '';
    $rk = 'prasa_nl_rl_' . md5($ip);
    $count = (int) get_transient($rk);
    if ($count >= 5) {
        $go('err');
    }
    set_transient($rk, $count + 1, HOUR_IN_SECONDS);

    $email = isset($_POST['nl_email']) ? sanitize_email(wp_unslash($_POST['nl_email'])) : '';
    $consent = !empty($_POST['nl_consent']);
    $edition = isset($_POST['nl_edition']) ? sanitize_text_field(wp_unslash($_POST['nl_edition'])) : 'India';
    if (!in_array($edition, array('India', 'US', 'Europe'), true)) {
        $edition = 'India';
    }
    if (!$email || !is_email($email) || !$consent) {
        $go('bad');
    }

    $subs = get_option(PRASA_IP_NL_OPTION, array());
    if (!is_array($subs)) {
        $subs = array();
    }
    $key = strtolower($email);
    if (isset($subs[$key]) && $subs[$key]['status'] === 'subscribed') {
        $go('dup');
    }
    $subs[$key] = array(
        'email' => $email,
        'edition' => $edition,
        'status' => 'subscribed',
        'consent' => 'Footer form consent box ticked',
        'date' => gmdate('Y-m-d H:i:s') . ' UTC',
        'page' => $back,
    );
    update_option(PRASA_IP_NL_OPTION, $subs, false);

    wp_mail(
        PRASA_IP_NL_NOTIFY,
        'New Patent Brief subscriber: ' . $email,
        "A new subscriber signed up on the website.\n\nEmail: {$email}\nEdition: {$edition}\nPage: {$back}\nDate: " . gmdate('Y-m-d H:i') . " UTC\n\nThe full list is in WordPress under Tools > Patent Brief."
    );
    $go('ok');
}
add_action('admin_post_nopriv_prasa_ip_subscribe', 'prasa_ip_newsletter_handle');
add_action('admin_post_prasa_ip_subscribe', 'prasa_ip_newsletter_handle');

/** Admin page: Tools > Patent Brief, with CSV export and unsubscribe. */
function prasa_ip_newsletter_admin_menu() {
    add_management_page('The Patent Brief subscribers', 'Patent Brief', 'manage_options', 'prasa-patent-brief', 'prasa_ip_newsletter_admin_page');
}
add_action('admin_menu', 'prasa_ip_newsletter_admin_menu');

function prasa_ip_newsletter_admin_actions() {
    if (!is_admin() || !isset($_GET['page']) || $_GET['page'] !== 'prasa-patent-brief' || !current_user_can('manage_options')) {
        return;
    }
    $subs = get_option(PRASA_IP_NL_OPTION, array());
    if (!is_array($subs)) {
        $subs = array();
    }
    if (isset($_GET['nl_export']) && check_admin_referer('prasa_nl_export')) {
        nocache_headers();
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="patent-brief-subscribers-' . gmdate('Y-m-d') . '.csv"');
        $out = fopen('php://output', 'w');
        fputcsv($out, array('email', 'edition', 'status', 'date', 'page', 'consent'));
        foreach ($subs as $s) {
            fputcsv($out, array($s['email'], $s['edition'], $s['status'], $s['date'], $s['page'], $s['consent']));
        }
        fclose($out);
        exit;
    }
    if (isset($_GET['nl_unsub']) && check_admin_referer('prasa_nl_unsub')) {
        $k = strtolower(sanitize_email(wp_unslash($_GET['nl_unsub'])));
        if (isset($subs[$k])) {
            $subs[$k]['status'] = 'unsubscribed';
            $subs[$k]['date'] .= ' (unsubscribed ' . gmdate('Y-m-d') . ')';
            update_option(PRASA_IP_NL_OPTION, $subs, false);
        }
        wp_safe_redirect(admin_url('tools.php?page=prasa-patent-brief'));
        exit;
    }
}
add_action('admin_init', 'prasa_ip_newsletter_admin_actions');

function prasa_ip_newsletter_admin_page() {
    $subs = get_option(PRASA_IP_NL_OPTION, array());
    if (!is_array($subs)) {
        $subs = array();
    }
    $active = count(array_filter($subs, function ($s) { return $s['status'] === 'subscribed'; }));
    $export = wp_nonce_url(admin_url('tools.php?page=prasa-patent-brief&nl_export=1'), 'prasa_nl_export');
    echo '<div class="wrap"><h1>The Patent Brief subscribers</h1>';
    echo '<p>' . esc_html($active) . ' subscribed, ' . esc_html(count($subs)) . ' in total. <a class="button" href="' . esc_url($export) . '">Export CSV</a></p>';
    echo '<table class="widefat striped"><thead><tr><th>Email</th><th>Edition</th><th>Status</th><th>Date</th><th>Page</th><th></th></tr></thead><tbody>';
    foreach (array_reverse($subs) as $s) {
        $un = wp_nonce_url(admin_url('tools.php?page=prasa-patent-brief&nl_unsub=' . rawurlencode($s['email'])), 'prasa_nl_unsub');
        echo '<tr><td>' . esc_html($s['email']) . '</td><td>' . esc_html($s['edition']) . '</td><td>' . esc_html($s['status']) . '</td><td>' . esc_html($s['date']) . '</td><td>' . esc_html($s['page']) . '</td><td>'
            . ($s['status'] === 'subscribed' ? '<a href="' . esc_url($un) . '">Unsubscribe</a>' : '') . '</td></tr>';
    }
    echo '</tbody></table></div>';
}
