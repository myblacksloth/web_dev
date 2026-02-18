angular.module('testApp', [])
  .controller('TestCtrl', function($scope, $q, $http) {

    $scope.logs = [];

    // ------------------------------------
    // Chiamate principali — restituiscono la risposta completa
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
    // Funzioni helper — restituiscono una promise che risolve true/false
    // Da usare per controlli/validazioni nel flusso, senza interrompere la catena
    // ------------------------------------

    // Controlla se l'utente è autorizzato prima di procedere
    function checkAutorizzazione() {
      $scope.logs.push({ type: 'info', msg: '--> Check autorizzazione su /api/auth...' });
      return $http.get('http://localhost:3000/api/auth')
        .then(function(res) {
          $scope.logs.push({ type: 'success', msg: 'Autorizzazione OK: ' + JSON.stringify(res.data) });
          return true;
        })
        .catch(function() {
          $scope.logs.push({ type: 'error', msg: 'Autorizzazione FALLITA' });
          return false;
        });
    }

    // Verifica che i dati ricevuti da api2 siano validi prima di chiamare api3
    function checkDatiValidi(dati) {
      $scope.logs.push({ type: 'info', msg: '--> Valido i dati su /api/validate...' });
      return $http.post('http://localhost:3000/api/validate', dati)
        .then(function(res) {
          $scope.logs.push({ type: 'success', msg: 'Dati validi: ' + JSON.stringify(res.data) });
          return true;
        })
        .catch(function() {
          $scope.logs.push({ type: 'error', msg: 'Dati NON validi' });
          return false;
        });
    }

    // Notifica un sistema esterno a fine catena (fire and forget con esito)
    function notificaCompletamento(payload) {
      $scope.logs.push({ type: 'info', msg: '--> Notifico completamento su /api/notify...' });
      return $http.post('http://localhost:3000/api/notify', payload)
        .then(function() {
          $scope.logs.push({ type: 'success', msg: 'Notifica inviata con successo' });
          return true;
        })
        .catch(function() {
          $scope.logs.push({ type: 'error', msg: 'Notifica FALLITA (non bloccante)' });
          return false; // non blocca il flusso
        });
    }

    // ------------------------------------
    // Catena principale
    // ------------------------------------
    $scope.runChain = function() {
      $scope.logs.push({ type: 'info', msg: '=== Avvio catena ===' });

      // Prima di tutto verifica l'autorizzazione
      checkAutorizzazione()
        .then(function(autorizzato) {
          if (!autorizzato) {
            return $q.reject({ step: 'auth', error: { data: 'Utente non autorizzato' } });
          }
          return callApi1();
        })
        .then(function(res1) {
          $scope.logs.push({ type: 'success', msg: 'OK /api1: ' + JSON.stringify(res1.data) });
          return callApi2();
        }, function(err) {
          return $q.reject({ step: '/api1', error: err });
        })
        .then(function(res2) {
          $scope.logs.push({ type: 'success', msg: 'OK /api2: ' + JSON.stringify(res2.data) });

          // Prima di chiamare api3, valida i dati ricevuti da api2
          return checkDatiValidi(res2.data)
            .then(function(validi) {
              if (!validi) {
                return $q.reject({ step: 'validate', error: { data: 'Dati di api2 non validi' } });
              }
              return callApi3();
            });
        }, function(err) {
          return $q.reject({ step: '/api2', error: err });
        })
        .then(function(res3) {
          $scope.logs.push({ type: 'success', msg: 'OK /api3: ' + JSON.stringify(res3.data) });

          // A fine catena notifica il completamento, ma non bloccare se fallisce
          return notificaCompletamento(res3.data)
            .then(function() {
              $scope.logs.push({ type: 'success', msg: '=== Catena completata con successo ===' });
            });
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
  