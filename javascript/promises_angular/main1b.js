angular.module('testApp', [])
  .controller('TestCtrl', function($scope, $q, $timeout) {

    $scope.logs = [];

    // Simula una chiamata $http normale
    function fakeHttp(apiName, shouldFail) {
      $scope.logs.push({ type: 'info', msg: '--> Chiamo ' + apiName + '...' });
      return $timeout(function() {}, 500).then(function() {
        if (shouldFail) {
          return $q.reject({ message: 'Errore simulato su ' + apiName });
        }
        return { data: 'risposta da ' + apiName };
      });
    }

    // Simula la chiamata HTTP che salva l'errore sul server (es. POST /api/log-error)
    function logErroreRemoto(step, messaggio) {
      var body = { step: step, messaggio: messaggio, timestamp: new Date().toISOString() };
      $scope.logs.push({ type: 'info', msg: '--> Invio errore al server: ' + JSON.stringify(body) });
      return $timeout(function() {}, 300).then(function() {
        // Simula risposta ok dal server di logging
        return { data: 'errore salvato sul server' };
      });
    }

    $scope.runChain = function(failAt) {
      $scope.logs.push({ type: 'info', msg: '=== Avvio catena (failAt=' + failAt + ') ===' });

      fakeHttp('API 1', failAt === 1)
        .then(function(res1) {
          $scope.logs.push({ type: 'success', msg: 'OK API 1: ' + res1.data });
          return fakeHttp('API 2', failAt === 2);
        }, function(err) {
          return $q.reject({ step: 'API 1', error: err });
        })
        .then(function(res2) {
          $scope.logs.push({ type: 'success', msg: 'OK API 2: ' + res2.data });
          return fakeHttp('API 3', failAt === 3);
        }, function(err) {
          return $q.reject({ step: 'API 2', error: err });
        })
        .then(function(res3) {
          $scope.logs.push({ type: 'success', msg: 'OK API 3: ' + res3.data });
          $scope.logs.push({ type: 'success', msg: '=== Catena completata con successo ===' });
        }, function(err) {
          return $q.reject({ step: 'API 3', error: err });
        })
        .catch(function(err) {
          $scope.logs.push({ type: 'error', msg: '*** CATCH FINALE — errore in: ' + err.step });
          $scope.logs.push({ type: 'error', msg: '    Dettaglio: ' + err.error.message });

          // Chiama il server per salvare l'errore
          return logErroreRemoto(err.step, err.error.message)
            .then(function(res) {
              $scope.logs.push({ type: 'info', msg: 'Server di log risponde: ' + res.data });
            })
            .catch(function(errLog) {
              // Se anche la chiamata di logging fallisce, non fare nulla di distruttivo
              // ma segnalalo nel log locale
              $scope.logs.push({ type: 'error', msg: '*** Impossibile salvare errore sul server: ' + errLog.message });
            });
        });
    };

    $scope.clearLog = function() {
      $scope.logs = [];
    };
  });
  