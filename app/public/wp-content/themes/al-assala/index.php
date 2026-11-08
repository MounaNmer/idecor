<?php
/**
 * Catalog page. Everything is rendered by assets/js/app.js from window.AA_CATALOG.
 */
$aa_lang = 'fr' === aa_setting( 'aa_default_lang' ) ? 'fr' : 'ar';
?><!DOCTYPE html>
<html lang="<?php echo esc_attr( $aa_lang ); ?>" dir="<?php echo 'ar' === $aa_lang ? 'rtl' : 'ltr'; ?>">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="color-scheme" content="light">
	<?php if ( ! has_site_icon() ) : // WordPress prints the Site Icon itself when one is set. ?>
	<link rel="icon" href="<?php echo esc_url( aa_logo_url() ); ?>">
	<link rel="apple-touch-icon" href="<?php echo esc_url( aa_logo_url() ); ?>">
	<?php endif; ?>
	<meta property="og:title" content="<?php echo esc_attr( aa_setting( 'aa_store_name' ) ); ?>">
	<meta property="og:image" content="<?php echo esc_url( aa_logo_url() ); ?>">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'aa' ); ?>>
<?php wp_body_open(); ?>
<div id="aa-app">
	<noscript><p style="padding:2rem;text-align:center">JavaScript est requis pour afficher le catalogue.</p></noscript>
</div>
<?php wp_footer(); ?>
</body>
</html>
