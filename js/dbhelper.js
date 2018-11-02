/**
 * Common database helper functions.
 */

const db_name = "restaurants";
const restaurantObjectStoreName = "restaurantStore"
const reviewsObjectStoreName = "reviewsStore"


const dbPromise = idb.open(db_name, 2, function(upgradeDB) {
  console.log('making a new object store');
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore(restaurantObjectStoreName, {keyPath: 'id'});
    case 1:
      {
        const reviews = upgradeDB.createObjectStore(reviewsObjectStoreName, {keyPath: 'id'});
        reviews.createIndex('restaurant_id', 'restaurant_id');
      }
  }
});



class DBHelper {

 /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337;
    return `http://localhost:${port}/restaurants`;
  }

  static get DATABASE_URL_REVIEWS() {
    const port = 1337;
    return `http://localhost:${port}/reviews/?restaurant_id=`;
  }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // get all restaurants from the IndexedDB
    dbPromise.then(db => {
      const tx = db.transaction(restaurantObjectStoreName);
      const restaurantStore = tx.objectStore(restaurantObjectStoreName);
      return restaurantStore.getAll();
   }).then(function(restaurants) {
     // check if the result is empty
     if (restaurants.length !== 0) {
       callback(null, restaurants);
     } else {
       // if the IndexedDB is empty, fetch the restaurants from API
       // then add them to the IndexedDB
       fetch(DBHelper.DATABASE_URL)
         .then(response => response.json())
         .then(restaurants => {
           dbPromise.then(db => {
             const tx = db.transaction(restaurantObjectStoreName, 'readwrite');
             const restaurantStore = tx.objectStore(restaurantObjectStoreName);
             for (let restaurant of restaurants) {
               restaurantStore.put(restaurant);
             }
             return tx.complete;
           }).then(function() {
             console.log('Restaurants added to IndexedDB');
           }).catch(function(error) {
             console.error(error);
           }).finally(function(error) {
             callback(null, restaurants);
           });
       }).catch(error => callback(error, null));
     }
   });
  }


  static fetchReviewsFromEndPoint(id, callback) {
    fetch(`${DBHelper.DATABASE_URL_REVIEWS}${id}`)
    .then(response => response.json())
    .then(reviews => {
      callback(null, reviews);
      dbPromise.then(db => {
        if (!db) return;
      const tx = db.transaction(reviewsObjectStoreName, 'readwrite');
      const reviewStore = tx.objectStore(reviewsObjectStoreName);
      if (Array.isArray(reviews)) {
        for (let review of reviews) {
          reviewStore.put(review);
        }
      } else {
        reviewStore.put(reviews);
      }
     });
    })
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    dbPromise.then(db => {
      const tx = db.transaction(restaurantObjectStoreName);
      const restaurantStore = tx.objectStore(restaurantObjectStoreName);
      return restaurantStore.get(parseInt(id))
    })
    .then(restaurant => {
      if (restaurant) {
        callback(null, restaurant);
      } else {
        fetch(`${DBHelper.DATABASE_URL}/${id}`)
          .then(response => response.json())
          .then(restaurants => callback(null, restaurants))
          .catch(error => callback(error, null));
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {

    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.id !== undefined)
      return (`/img/${restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }


  static submitReview(reviewBody) {
    const offlineReviewObj = {
      name: 'addReview',
      data : reviewBody,
      object_type : 'review'
    }

    if(!navigator.onLine && offlineReviewObj.name === 'addReview') {
      DBHelper.sendReviewWhenOnline(offlineReviewObj);
      return ;
    }

    const serverReview = {
      'restaurant_id': parseInt(reviewBody.restaurant_id),
      'name': reviewBody.name,
      'rating': parseInt(reviewBody.rating),
      'comments': reviewBody.comments,

    };

    const fetchOptions = {
      method: 'POST',
      body: JSON.stringify(serverReview),
      headers: new Headers({
        'content-Type' : 'application/json'
      })
    }

    fetch(`http://localhost:1337/reviews/`, fetchOptions)
    .then(response => {
      const contentType = response.headers.get('content-Type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        return response.json();
      }
  })
}


  static sendReviewWhenOnline(offlineReview){
    localStorage.setItem('data', JSON.stringify(offlineReview.data));
    window.addEventListener('online', function() {
        const review = JSON.parse(localStorage.getItem('data'));
        if (review !== null) {
        DBHelper.submitReview(review);
        localStorage.removeItem('data');
        }
    });
  }


  static updateFavorite(id, status){
    const urlDatabase = DBHelper.DATABASE_URL;
    fetch(`${DBHelper.DATABASE_URL}/${id}/?is_favorite=${status}`, {method:'PUT'})
      dbPromise.then(db => {
        const tx = db.transaction(restaurantObjectStoreName, 'readwrite');
        const restaurantStore = tx.objectStore(restaurantObjectStoreName);
          restaurantStore.get(parseInt(id))
          .then(restaurant => {
            restaurant.is_favorite = status;
            restaurantStore.put(restaurant);
          });
      });
  }

  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}
