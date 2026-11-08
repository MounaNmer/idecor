<?php
/**
 * Tapisserie Al Assala – catalog theme.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AA_VERSION', '1.0.2' );
define( 'AA_DIR', get_template_directory() );
define( 'AA_URI', get_template_directory_uri() );

/* -------------------------------------------------------------------------
 * Setup
 * ---------------------------------------------------------------------- */
add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-logo', array(
		'height'      => 256,
		'width'       => 256,
		'flex-height' => true,
		'flex-width'  => true,
	) );
	add_image_size( 'aa-card', 600, 600, true );
} );

/* -------------------------------------------------------------------------
 * Products (custom post type) + categories (taxonomy)
 * ---------------------------------------------------------------------- */
add_action( 'init', function () {
	register_post_type( 'aa_product', array(
		'labels'       => array(
			'name'          => 'Produits',
			'singular_name' => 'Produit',
			'add_new_item'  => 'Ajouter un produit',
			'edit_item'     => 'Modifier le produit',
			'all_items'     => 'Tous les produits',
		),
		'public'       => true,
		'show_in_rest' => true,
		'menu_icon'    => 'dashicons-products',
		'supports'     => array( 'title', 'editor', 'thumbnail', 'page-attributes' ),
		'rewrite'      => array( 'slug' => 'produit' ),
	) );

	register_taxonomy( 'aa_category', 'aa_product', array(
		'labels'            => array(
			'name'          => 'Catégories',
			'singular_name' => 'Catégorie',
			'add_new_item'  => 'Ajouter une catégorie',
		),
		'hierarchical'      => true,
		'show_admin_column' => true,
		'show_in_rest'      => true,
		'rewrite'           => array( 'slug' => 'categorie' ),
	) );
} );

/* Price meta box */
add_action( 'add_meta_boxes', function () {
	add_meta_box( 'aa_price', 'Prix', function ( $post ) {
		wp_nonce_field( 'aa_price', 'aa_price_nonce' );
		$price = get_post_meta( $post->ID, '_aa_price', true );
		printf(
			'<input type="number" min="0" step="0.01" name="aa_price" value="%s" style="width:100%%" /> <p class="description">%s</p>',
			esc_attr( $price ),
			esc_html( get_theme_mod( 'aa_currency', 'MAD' ) )
		);
	}, 'aa_product', 'side', 'high' );
} );

add_action( 'save_post_aa_product', function ( $post_id ) {
	if ( ! isset( $_POST['aa_price_nonce'] ) || ! wp_verify_nonce( $_POST['aa_price_nonce'], 'aa_price' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	if ( isset( $_POST['aa_price'] ) ) {
		update_post_meta( $post_id, '_aa_price', (float) $_POST['aa_price'] );
	}
} );

add_filter( 'manage_aa_product_posts_columns', function ( $cols ) {
	$cols['aa_price'] = 'Prix';
	return $cols;
} );
add_action( 'manage_aa_product_posts_custom_column', function ( $col, $post_id ) {
	if ( 'aa_price' === $col ) {
		echo esc_html( get_post_meta( $post_id, '_aa_price', true ) );
	}
}, 10, 2 );

/* -------------------------------------------------------------------------
 * Customizer: store settings
 * ---------------------------------------------------------------------- */
add_action( 'customize_register', function ( $wp_customize ) {
	$wp_customize->add_section( 'aa_catalog', array( 'title' => 'Catalogue', 'priority' => 30 ) );

	$fields = array(
		'aa_store_name'   => array( 'Nom de la boutique', 'Tapisserie Al Assala' ),
		'aa_whatsapp'     => array( 'Numéro WhatsApp (format international)', '212708088042' ),
		'aa_phone_label'  => array( 'Numéro affiché', '0708088042' ),
		'aa_currency'     => array( 'Devise (code ISO)', 'MAD' ),
		'aa_default_lang' => array( 'Langue par défaut (ar / fr)', 'ar' ),
	);
	foreach ( $fields as $id => $f ) {
		$wp_customize->add_setting( $id, array( 'default' => $f[1], 'sanitize_callback' => 'sanitize_text_field' ) );
		$wp_customize->add_control( $id, array( 'label' => $f[0], 'section' => 'aa_catalog', 'type' => 'text' ) );
	}
	$wp_customize->add_setting( 'aa_prices_hidden', array( 'default' => false, 'sanitize_callback' => 'rest_sanitize_boolean' ) );
	$wp_customize->add_control( 'aa_prices_hidden', array( 'label' => 'Masquer les prix', 'section' => 'aa_catalog', 'type' => 'checkbox' ) );
} );

function aa_setting( $key ) {
	$defaults = array(
		'aa_store_name'    => 'Tapisserie Al Assala',
		'aa_whatsapp'      => '212708088042',
		'aa_phone_label'   => '0708088042',
		'aa_currency'      => 'MAD',
		'aa_default_lang'  => 'ar',
		'aa_prices_hidden' => false,
	);
	return get_theme_mod( $key, $defaults[ $key ] );
}

function aa_logo_url() {
	$id = get_theme_mod( 'custom_logo' );
	if ( $id ) {
		$src = wp_get_attachment_image_url( $id, 'medium' );
		if ( $src ) {
			return $src;
		}
	}
	return AA_URI . '/assets/logo.webp';
}

/* -------------------------------------------------------------------------
 * Catalog data passed to the front end
 * ---------------------------------------------------------------------- */
function aa_catalog_data() {
	$terms = get_terms( array(
		'taxonomy'   => 'aa_category',
		'hide_empty' => true,
		'meta_key'   => 'aa_order',
		'orderby'    => 'meta_value_num',
		'order'      => 'ASC',
	) );
	// Terms created by hand have no aa_order; include them too.
	$all = get_terms( array( 'taxonomy' => 'aa_category', 'hide_empty' => true ) );
	$seen = array();
	$categories = array();
	foreach ( array_merge( is_array( $terms ) ? $terms : array(), is_array( $all ) ? $all : array() ) as $t ) {
		if ( isset( $seen[ $t->term_id ] ) ) {
			continue;
		}
		$seen[ $t->term_id ] = true;
		$categories[] = array( 'id' => $t->term_id, 'name' => $t->name, 'count' => 0 );
	}
	$cat_index = array();
	foreach ( $categories as $i => $c ) {
		$cat_index[ $c['id'] ] = $i;
	}

	$posts = get_posts( array(
		'post_type'      => 'aa_product',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'orderby'        => array( 'menu_order' => 'ASC', 'date' => 'ASC' ),
	) );

	$products    = array();
	$other_count = 0;
	foreach ( $posts as $p ) {
		$cats   = wp_get_post_terms( $p->ID, 'aa_category', array( 'fields' => 'ids' ) );
		$cat_id = ( ! is_wp_error( $cats ) && $cats ) ? (int) $cats[0] : null;
		if ( null !== $cat_id && isset( $cat_index[ $cat_id ] ) ) {
			$categories[ $cat_index[ $cat_id ] ]['count']++;
		} else {
			$cat_id = null;
			$other_count++;
		}

		$photos   = array();
		$thumb_id = get_post_thumbnail_id( $p->ID );
		$ids      = $thumb_id ? array( $thumb_id ) : array();
		foreach ( get_attached_media( 'image', $p->ID ) as $att ) {
			if ( (int) $att->ID !== (int) $thumb_id ) {
				$ids[] = $att->ID;
			}
		}
		foreach ( $ids as $id ) {
			$full = wp_get_attachment_image_url( $id, 'full' );
			if ( $full ) {
				$photos[] = array(
					'full'  => $full,
					'thumb' => wp_get_attachment_image_url( $id, 'aa-card' ) ?: $full,
				);
			}
		}

		$desc = trim( wp_strip_all_tags( $p->post_content ) );
		$products[] = array(
			'id'          => $p->ID,
			'name'        => get_the_title( $p ),
			'price'       => (float) get_post_meta( $p->ID, '_aa_price', true ),
			'categoryId'  => $cat_id,
			'description' => '' === $desc ? null : $desc,
			'photos'      => $photos,
		);
	}

	return array(
		'store'        => aa_setting( 'aa_store_name' ),
		'logo'         => aa_logo_url(),
		'whatsapp'     => preg_replace( '/\D+/', '', aa_setting( 'aa_whatsapp' ) ),
		'phoneLabel'   => aa_setting( 'aa_phone_label' ),
		'currency'     => aa_setting( 'aa_currency' ),
		'pricesHidden' => (bool) aa_setting( 'aa_prices_hidden' ),
		'defaultLang'  => 'fr' === aa_setting( 'aa_default_lang' ) ? 'fr' : 'ar',
		'categories'   => array_values( array_filter( $categories, function ( $c ) {
			return $c['count'] > 0;
		} ) ),
		'otherCount'   => $other_count,
		'products'     => $products,
	);
}

/* -------------------------------------------------------------------------
 * Assets
 * ---------------------------------------------------------------------- */
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'aa-font', 'https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300..700&display=swap', array(), null );
	wp_enqueue_style( 'aa-app', AA_URI . '/assets/css/app.css', array(), AA_VERSION );
	wp_enqueue_script( 'aa-app', AA_URI . '/assets/js/app.js', array(), AA_VERSION, true );
	wp_add_inline_script( 'aa-app', 'window.AA_CATALOG = ' . wp_json_encode( aa_catalog_data() ) . ';', 'before' );
} );

/* Remove default block styles we don't need on the catalog */
add_action( 'wp_enqueue_scripts', function () {
	wp_dequeue_style( 'wp-block-library' );
	wp_dequeue_style( 'global-styles' );
	wp_dequeue_style( 'classic-theme-styles' );
}, 100 );

add_filter( 'pre_get_document_title', function () {
	return aa_setting( 'aa_store_name' );
} );

/* Single product URLs open the catalog with the product sheet */
add_action( 'template_redirect', function () {
	if ( is_singular( 'aa_product' ) ) {
		wp_safe_redirect( add_query_arg( 'item', get_queried_object_id(), home_url( '/' ) ) );
		exit;
	}
} );

/* -------------------------------------------------------------------------
 * Import the original catalog on theme activation
 * ---------------------------------------------------------------------- */
require_once AA_DIR . '/inc/seed.php';
add_action( 'after_switch_theme', 'aa_seed_catalog' );
