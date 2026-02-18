angular.module('testApp', [])
  .controller('TestCtrl', function($scope, $q, $http) {

    $scope.logs = [];

    // ------------------------------------
    // Chiamate reali a localhost:3000
    // ------------------------------------
    function callApi1() {
      $scope.logs.push({ type: 'info', msg: '--> Chiamo /api1...' });
      return $http.get('http://localhost:3000/api1')
        .then(function(res) {
          return res;
        });
    }

    function callApi2() {
      $scope.logs.push({ type: 'info', msg: '--> Chiamo /api2...' });
      return $http.get('http://localhost:3000/api2')
        .then(function(res) {
          return res;
        });
    }

    function callApi3() {
      $scope.logs.push({ type: 'info', msg: '--> Chiamo /api3...' });
      return $http.get('http://localhost:3000/api3')
        .then(function(res) {
          return res;
        });
    }

    function callFinally(step, messaggio) {
      var body = { step: step, messaggio: messaggio, timestamp: new Date().toISOString() };
      $scope.logs.push({ type: 'info', msg: '--> Chiamo /finally con body: ' + JSON.stringify(body) });
      return $http.post('http://localhost:3000/finally', body)
        .then(function(res) {
          return res;
        });
    }

    // ------------------------------------
    // Catena principale
    // ------------------------------------
    $scope.runChain = function() {
      $scope.logs.push({ type: 'info', msg: '=== Avvio catena ===' });

      // diversamente .... return callApi1() .......
      callApi1()
        .then(function(res1) {
          $scope.logs.push({ type: 'success', msg: 'OK /api1: ' + JSON.stringify(res1.data) });
          return callApi2();
        }, function(err) {
          return $q.reject({ step: '/api1', error: err });
        })
        .then(function(res2) {
          $scope.logs.push({ type: 'success', msg: 'OK /api2: ' + JSON.stringify(res2.data) });
          return callApi3();
        }, function(err) {
          return $q.reject({ step: '/api2', error: err });
        })
        .then(function(res3) {
          $scope.logs.push({ type: 'success', msg: 'OK /api3: ' + JSON.stringify(res3.data) });
          $scope.logs.push({ type: 'success', msg: '=== Catena completata con successo ===' });
          return { all: 'ok' };  // <-- qui tutto ok, la chain di promises finise
        }, function(err) {
          return $q.reject({ step: '/api3', error: err });
        })
        .catch(function(err) {
          var messaggio = err.error && err.error.data ? JSON.stringify(err.error.data) : 'Errore sconosciuto';
          $scope.logs.push({ type: 'error', msg: '*** CATCH FINALE — errore in: ' + err.step });
          $scope.logs.push({ type: 'error', msg: '    Dettaglio: ' + messaggio });

          return callFinally(err.step, messaggio)
            .then(function(res) {
              $scope.logs.push({ type: 'info', msg: '/finally risponde: ' + JSON.stringify(res.data) });
            })
            .catch(function(errFinally) {
              $scope.logs.push({ type: 'error', msg: '*** /finally non raggiungibile: ' + errFinally.status });
            });
        });
    };

    $scope.clearLog = function() {
      $scope.logs = [];
    };
  });