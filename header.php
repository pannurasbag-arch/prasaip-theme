<!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?php echo esc_html(wp_get_document_title()); ?></title>
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div class="topbar"><span>Bengaluru, India · Sheridan, USA</span><a href="tel:+919113214395">+91 91132 14395</a></div>
<header class="header">
<a class="logo" href="<?php echo esc_url(home_url('/')); ?>" aria-label="PRASA IP home"><img src="<?php echo esc_url(get_template_directory_uri() . '/static/assets/prasa-ip-logo.webp'); ?>" alt="PRASA IP" width="632" height="395"></a>
<button class="menu" aria-expanded="false" aria-controls="nav">Menu</button>
<nav id="nav" aria-label="Primary navigation">
<a href="<?php echo esc_url(home_url('/')); ?>">Home</a>
<a href="<?php echo esc_url(home_url('/patent-services/')); ?>">Patents</a>
<a href="<?php echo esc_url(home_url('/trademark-services/')); ?>">Trademarks</a>
<a href="<?php echo esc_url(home_url('/technology-sectors/')); ?>">Technology</a>
<a href="<?php echo esc_url(home_url('/professionals/')); ?>">Professionals</a>
<a href="<?php echo esc_url(home_url('/knowledge-centre/')); ?>">Insights</a>
</nav>
<a class="header-cta" href="<?php echo esc_url(home_url('/#contact')); ?>">Discuss your matter</a>
</header>
