
let dbPromise = idb.open("restaurant-review", 1, function(upgradeDB) {
upgradeDB.createObjectStore("restaurants", { keyPath: "id" });
});


/**
 * Common database helper functions.
 */
class DBHelper {


  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337;
    return `http://localhost:${port}/restaurants`;
  }


  /**
   * Fetch all restaurants.
   */
  // static localFetchRestaurants(callback) {
  //   let xhr = new XMLHttpRequest();
  //   xhr.open('GET','http://localhost:8000/data/restaurants.json');
  //   xhr.onload = () => {
  //     if (xhr.status === 200) { // Got a success response from server!
  //       const json = JSON.parse(xhr.responseText);
  //       const restaurants = json.restaurants;
  //       callback(null, restaurants);
  //     } else { // Oops!. Got an error from server.
  //       const error = (`Request failed. Returned status of ${xhr.status}`);
  //       callback(error, null);
  //     }
  //   };
  //   xhr.send();
  // }

  // static fetchRestaurants(callback) {
  //   fetch(DBHelper.DATABASE_URL)
  //     .then(response => {
  //       if (!response.ok) {
  //         const error = (`Request failed. Returned status of ${response.statusText}`);
  //         callback(error, null);
  //       }
  //       const restaurants = response.json();
  //       return restaurants;
  //     })
  //     .then(restaurants => callback(null, restaurants))
  //     .catch(error => {
  //       console.log(error)
  //       DBHelper.localFetchRestaurants(callback);
  //     })
  // }

  static fetchRestaurants(callback) {
    dbPromise.then(function(db) {
      const tx = db.transaction("restaurants");
      const restaurantStore = tx.objectStore("restaurants");
      return restaurantStore.getAll();
    }).then(function(restaurants) {
      if (restaurants.length !== 0) {
        callback(null, restaurants);
      } else {
          fetch(DBHelper.DATABASE_URL)
          .then(response => response.json())
          .then(restaurants => {
            dbPromise.then(function(db){
              const tx = db.transaction("restaurants", "readwrite");
              const restaurantStore = tx.objectStore("restaurants");
              for (let restaurant of restaurants) {
                restaurantStore.put(restaurant);
              }
              return tx.complete;
            }).then(function() {
              console.log("Restaurants added to IndexedDB");
            }).catch(function(error) {
              console.error(error);
            }).finally(function(error) {
              callback(null, restaurants);
            });
          })
          .catch(error => callback(error, null));
      }
    });
  }


  // static localFetchRestaurantById(id, callback) {
  //   DBHelper.localFetchRestaurants((error, restaurants) => {
  //     if (error) {
  //       callback(error, null);
  //     } else {
  //       const restaurant = restaurants.find(r => r.id == id);
  //       if (restaurant) { // Got the restaurant
  //         callback(null, restaurant);
  //       } else { // Restaurant does not exist in the database
  //         callback('Restaurant does not exist', null);
  //       }
  //     }
  //   });
  // }

  // static fetchRestaurantById(id, callback) {
  //   DBHelper.fetchRestaurants((error, restaurants) => {
  //     if (error) {
  //       // callback(error, null);
  //       DBHelper.localFetchRestaurantsById(id, callback);
  //     } else {
  //       const restaurant = restaurants.find(r => r.id == id);
  //       if (restaurant) {
  //         callback(null, restaurant);
  //       } else {
  //         callback('Restaurant does not exist', null);
  //       }
  //     }
  //   });
  // }

  static fetchRestaurantById(id, callback) {
    dbPromise.then(function(db){
      const tx = db.transaction("restaurants");
      const restaurantStore = tx.objectStore("restaurants");
      return restaurantStore.get(parseInt(id))
    }).then(function(restaurant) {
      if (restaurant) {
        callback(null, restaurant);
      } else {
        fetch(DBHelper.DATABASE_URL + '/' + id)
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
      });
      marker.addTo(newMap);
    return marker;
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



