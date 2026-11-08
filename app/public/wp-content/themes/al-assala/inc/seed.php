<?php
/**
 * One-time import of the original Tapisserie Al Assala catalog
 * (categories, products, prices and photos bundled in assets/products).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function aa_seed_catalog() {
	if ( get_option( 'aa_seeded' ) ) {
		return;
	}
	$json = file_get_contents( AA_DIR . '/inc/seed.json' );
	$data = json_decode( $json, true );
	if ( ! $data || empty( $data['products'] ) ) {
		return;
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	if ( ! taxonomy_exists( 'aa_category' ) || ! post_type_exists( 'aa_product' ) ) {
		return;
	}

	$term_map = array();
	foreach ( $data['categories'] as $i => $cat ) {
		$existing = term_exists( $cat['name'], 'aa_category' );
		$term     = $existing ? $existing : wp_insert_term( $cat['name'], 'aa_category' );
		if ( is_wp_error( $term ) ) {
			continue;
		}
		$term_id = (int) $term['term_id'];
		update_term_meta( $term_id, 'aa_order', $i );
		$term_map[ $cat['id'] ] = $term_id;
	}

	foreach ( $data['products'] as $i => $prod ) {
		$post_id = wp_insert_post( array(
			'post_type'    => 'aa_product',
			'post_status'  => 'publish',
			'post_title'   => $prod['name'],
			'post_content' => (string) $prod['description'],
			'menu_order'   => $i,
		) );
		if ( is_wp_error( $post_id ) || ! $post_id ) {
			continue;
		}
		update_post_meta( $post_id, '_aa_price', $prod['price'] );
		if ( isset( $term_map[ $prod['categoryId'] ] ) ) {
			wp_set_object_terms( $post_id, array( $term_map[ $prod['categoryId'] ] ), 'aa_category' );
		}

		foreach ( $prod['photos'] as $j => $photo ) {
			$src = AA_DIR . '/assets/products/' . basename( $photo );
			if ( ! file_exists( $src ) ) {
				continue;
			}
			$tmp = wp_tempnam( basename( $photo ) );
			copy( $src, $tmp );
			$file = array(
				'name'     => sanitize_title( $prod['name'] ) . '-' . ( $j + 1 ) . '.webp',
				'tmp_name' => $tmp,
			);
			$att_id = media_handle_sideload( $file, $post_id, $prod['name'] );
			if ( is_wp_error( $att_id ) ) {
				@unlink( $tmp );
				continue;
			}
			if ( 0 === $j ) {
				set_post_thumbnail( $post_id, $att_id );
			}
		}
	}

	update_option( 'aa_seeded', 1 );
	flush_rewrite_rules();
}
