angular.module('testApp', [])
  .controller('TestCtrl', function($scope, $q, $http) {

    $scope.logs = [];

    // ------------------------------------
    // Funzione di logging verso il server
    // - NON restituisce la promise alla catena (fire and forget)
    // - NON interferisce con la chain: può essere rimossa senza conseguenze
    // - gli errori sono gestiti internamente e non si propagano
    // ------------------------------------
    function logRemoto(source, messaggio, level) {
      var body = {
        source: source,
        message: messaggio,
        level: level || 'info'
      };
      $http.post('http://localhost:5000/logger', body)
        .then(function() {
          // successo silenzioso — non tocca la catena
        })
        .catch(function() {
          // errore silenzioso — il logger non deve mai bloccare il flusso
        });
      // nessun return: la promise non entra nella catena
    }

    // ------------------------------------
    // Chiamate reali a localhost:3000
    // ------------------------------------
    function callApi1() {
      $scope.logs.push({ type: 'info', msg: '--> Chiamo /api1...' });
      return $http.get('http://localhost:3000/api1')
        .then(function(res) { return res; });
    }

    function callApi2() {
      $scope.logs.push({ type: 'info', msg: '--> Chiamo /api2...' });
      return $http.get('http://localhost:3000/api2')
        .then(function(res) { return res; });
    }

    function callApi3() {
      $scope.logs.push({ type: 'info', msg: '--> Chiamo /api3...' });
      return $http.get('http://localhost:3000/api3')
        .then(function(res) { return res; });
    }

    function callFinally(step, messaggio) {
      var body = { step: step, messaggio: messaggio, timestamp: new Date().toISOString() };
      $scope.logs.push({ type: 'info', msg: '--> Chiamo /finally con body: ' + JSON.stringify(body) });
      return $http.post('http://localhost:3000/finally', body)
        .then(function(res) { return res; });
    }

    // ------------------------------------
    // Catena principale
    // ------------------------------------
    $scope.runChain = function() {
      $scope.logs.push({ type: 'info', msg: '=== Avvio catena ===' });
      logRemoto('runChain', 'Avvio catena', 'info');

      return callApi1()
        .then(function(res1) {
          $scope.logs.push({ type: 'success', msg: 'OK /api1: ' + JSON.stringify(res1.data) });
          logRemoto('/api1', 'OK: ' + JSON.stringify(res1.data), 'info');
          return callApi2();
        }, function(err) {
          logRemoto('/api1', 'ERRORE: ' + JSON.stringify(err.data), 'error');
          return $q.reject({ step: '/api1', error: err });
        })
        .then(function(res2) {
          $scope.logs.push({ type: 'success', msg: 'OK /api2: ' + JSON.stringify(res2.data) });
          logRemoto('/api2', 'OK: ' + JSON.stringify(res2.data), 'info');
          return callApi3();
        }, function(err) {
          logRemoto('/api2', 'ERRORE: ' + JSON.stringify(err.data), 'error');
          return $q.reject({ step: '/api2', error: err });
        })
        .then(function(res3) {
          $scope.logs.push({ type: 'success', msg: 'OK /api3: ' + JSON.stringify(res3.data) });
          $scope.logs.push({ type: 'success', msg: '=== Catena completata con successo ===' });
          logRemoto('/api3', 'OK: ' + JSON.stringify(res3.data), 'info');
          logRemoto('runChain', 'Catena completata con successo', 'info');
        }, function(err) {
          logRemoto('/api3', 'ERRORE: ' + JSON.stringify(err.data), 'error');
          return $q.reject({ step: '/api3', error: err });
        })
        .catch(function(err) {
          var messaggio = err.error && err.error.data ? JSON.stringify(err.error.data) : 'Errore sconosciuto';
          $scope.logs.push({ type: 'error', msg: '*** CATCH FINALE — errore in: ' + err.step });
          $scope.logs.push({ type: 'error', msg: '    Dettaglio: ' + messaggio });
          logRemoto('catch-finale', 'Errore in ' + err.step + ': ' + messaggio, 'error');

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
  