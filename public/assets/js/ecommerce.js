$(function() {

        $( "form" ).each(function() {
            $( this ).attr( "autocomplete", "off" ).find( ":first" ).
            before( '<input autocomplete="off" type="text" style="display:none;">' );
        });

        if( $( "#s" ).length ) {
            $( "#s" ).typeahead({
                source: function ( query, result ) {
                    $.ajax({
                        url: "/ajax/autocomplete",
                        data: 's=' + query,
                        dataType: "json",
                        type: "GET",
                        success: function ( data ) {
                            result( $.map( data, function ( item ) {
                                return '<span data-href="' + item[0] + '" class="item-suggested">' + item[1] + '</span>';
                            }));
                        }
                    });
                },
                select: function() {
                    var url = $( "#s" ).next().find( ".active .item-suggested" ).data( "href" );
                    window.location = url;
                }
            })
        }

        var getProducts = function( value ) {

            value = parseInt( value, 10 ) || 1;

            var perPage = 10;
            var $products = $( ".ajax-scroll .product" );
            var current = $products.length;
            var page = value + 1;
            var txt = $products.eq( 0 ).find( ".btn" ).text();

            $.get( "/ajax/infinite", { page: page }, function( response ) {
                if( Array.isArray( response ) && response.length > 0 ) {
                    var html = '';
                    for( var i = 0; i < response.length; i++ ) {
                        var product = response[i];
                        html += '<article class="col-md-6 product">';
                        html += '<header><h3>' + product.name + '</h3></header>';
                        html += '<figure><a href="' + product.link + '"><img src="' + product.image + '" class="img-fluid" alt=""></a></figure>';
                        html += ' <p class="text-muted text-truncate">' + product.description + '</p>';
                        html += '<footer class="row">';
                        html += '<div class="col-md-6">' + product.price + '</div>';
                        html += '<div class="text-right col-md-6">';
                        html += '<a href="' + product.add_to_cart_link + '" class="btn btn-success">' + txt + '</a>';
                        html += '</div>';
                        html += '</footer>';
                        html += '</article>';
                    }
                    $( ".ajax-scroll" ).data( "page", page ).append( html );
                }
            });
        };

        if( $( ".ajax-scroll" ).length && $( ".ajax-scroll .product" ).length ) {
            $( ".ajax-scroll" ).data( "page", 1 );
            $( window ).scroll(function() {
                if( $( window ).scrollTop() + $( window ).height() >= $( document ).height() ) {
                    getProducts( $( ".ajax-scroll" ).data( "page" ) );
                }
            });
        }

        var $formCart = $( "#form-cart" );
        var $formCheckout = $( "#form-checkout" );

        if( $( "#mobile-nav" ).length ) {
            $( "#mobile-menu" ).height( $( window ).height() - $( "#mobile-nav" ).outerHeight() );
            $( "#open-menu" ).click(function() {
                $( "#mobile-menu" ).toggle();
                return false;
            });
            $( "#site" ).css( "margin-top", $( "#mobile-nav" ).outerHeight() );
        }

        if( $( "#front-cart" ).length ) {
            $( "#front-cart-trigger" ).click(function() {
                var $target = $( $( this ).attr( "href" ) );
                if( $target.is( ":hidden" ) ) {
                    $target.show();
                } else {
                    $target.hide();
                }
                return false;
            });
        }

        if( $formCart.length ) {
            $( ".remove-cart-item" ).click(function() {
                var $a = $( this );
                var href = $a.attr( "href" );
                var productId = href.split( "?" )[1].replace( "remove-item=", "" );
                var data = {
                    ajax: "cart_remove",
                    id: productId
                };
                $.post( "/cart", data, function( response ) {
                    var url = location.href;
                    if( response.status === "ok" ) {
                        window.location = url;
                    }
                });
                return false;
            });

            $formCart.on( "submit", function( e ) {
                e.preventDefault();
                var $form = $( this );
                var $qtys = $form.find( ".qty" );
                var qtys = [];
                $qtys.each(function() {
                    var part = $( this ).data( "id" ) + "-" + $( this ).val()
                    qtys.push( part );
                });
                var qs = qtys.join( "," );
                var data = {
                    ajax: "cart_update",
                    qty: qs
                };
                $.post( "/cart", data, function( response ) {
                    var url = location.href;
                    if( response.status === "ok" ) {
                        window.location = url;
                    }
                });
            });
        }

        if( $formCheckout.length ) {

            $( document ).ajaxError(function( event, request, settings ) {
                console.log( request );
            });

            $formCheckout.on( "submit", function( e ) {
                e.preventDefault();
                var $form = $( this );
                var data = "ajax=1&" + $form.serialize();

                $form.find( ".alert" ).remove();
                $form.find( ".input-error" ).removeClass( "input-error" );

                $.post( "/checkout", data, function( response ) {
                    if( !response.status ) {
                        for( var p in response.billing ) {
                            $form.find( "[name=" + p + "]" ).addClass( "input-error" ).
                            after( '<div class="alert alert-danger mt-5 mb-5">' + response.billing[p] + '</div>' );
                        }
                        if( response.shipping ) {
                            for( var s in response.shipping ) {
                                $form.find( "[name=" + s + "]" ).addClass( "input-error" ).
                                after( '<div class="alert alert-danger mt-5 mb-5">' + response.shipping[s] + '</div>' );
                            }
                        }
                    } else {
                        window.location = response.redirect;
                    }
                });
            });

            $( "#same-billing" ).on( "change", function() {
                if( $( this ).prop( "checked" ) ) {
                    $( "#shipping-fields" ).hide();
                    $( "#billing-fields" ).removeClass().addClass( "col-md-12" );
                } else {
                    $( "#shipping-fields" ).show();
                    $( "#billing-fields" ).removeClass().addClass( "col-md-6" );
                }
            });

            $( "#billing-fields input" ).on( "blur", function() {
                var $input = $( this );
                var value = $input.val();
                var type = $input.attr( "type" );
                if( type === "email" ) {
                    if( !validator.isEmail( value ) ) {
                        $input.addClass( "input-error" );
                    }
                } else {
                    if( validator.isEmpty( value ) ) {
                        $input.addClass( "input-error" );
                    }
                }
            });

            $( "#billing-fields input" ).on( "keyup", function() {
                var $input = $( this );
                if( $input.hasClass( "input-error" ) ) {
                    $input.removeClass( "input-error" );
                }
            });

            $( "#shipping-fields input" ).on( "blur", function() {
              if( !$( "#same-billing" ).prop( "checked" ) ) {  
                    var $input = $( this );
                    var value = $input.val();
                    var type = $input.attr( "type" );
                    if( type === "email" ) {
                        if( !validator.isEmail( value ) ) {
                            $input.addClass( "input-error" );
                        }
                    } else {
                        if( validator.isEmpty( value ) ) {
                            $input.addClass( "input-error" );
                        }
                    }
                }
            });

            $( "#shipping-fields input" ).on( "keyup", function() {
                if( !$( "#same-billing" ).prop( "checked" ) ) {  
                    var $input = $( this );
                    if( $input.hasClass( "input-error" ) ) {
                        $input.removeClass( "input-error" );
                    }
                }
            });
        }
});