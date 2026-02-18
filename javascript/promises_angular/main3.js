angular.module('testApp', [])
  .controller('TestCtrl', function($scope, $q, $timeout) {

    $scope.logs = [];

    // ------------------------------------
    // Simula chiamate HTTP con body
    // ------------------------------------
    function fakeHttp(apiName, body, shouldFail) {
      $scope.logs.push({ type: 'info', msg: '--> Chiamo ' + apiName + ' con body: ' + JSON.stringify(body) });
      return $timeout(function() {}, 500).then(function() {
        if (shouldFail) {
          return $q.reject({ message: 'Errore simulato su ' + apiName });
        }
        // Ogni API restituisce dati che la chiamata successiva userà
        var risposte = {
          'API 1': { id: 42,       nome: 'Mario Rossi' },
          'API 2': { ordineId: 99, totale: 150.00 },
          'API 3': { spedizione: 'EXPRESS', giorni: 2 }
        };
        return { data: risposte[apiName] };
      });
    }

    // ------------------------------------
    // Chiamate sequenziali con passaggio dati
    // API 1 → restituisce utente
    // API 2 → usa id utente per recuperare ordine
    // API 3 → usa ordineId per recuperare spedizione
    // ------------------------------------
    $scope.runChain = function(failAt) {
      $scope.logs.push({ type: 'info', msg: '=== Avvio catena (failAt=' + failAt + ') ===' });

      var risposte = {};

      var steps = [
        function(prev) {
          // Prima chiamata: nessun dato precedente
          return fakeHttp('API 1', { richiesta: 'dati utente' }, failAt === 1);
        },
        function(prev) {
          // Usa la risposta di API 1
          risposte.utente = prev.data;
          $scope.logs.push({ type: 'success', msg: 'API 1 OK — utente id: ' + prev.data.id + ', nome: ' + prev.data.nome });
          return fakeHttp('API 2', { idUtente: prev.data.id }, failAt === 2);
        },
        function(prev) {
          // Usa la risposta di API 2
          risposte.ordine = prev.data;
          $scope.logs.push({ type: 'success', msg: 'API 2 OK — ordine id: ' + prev.data.ordineId + ', totale: ' + prev.data.totale });
          return fakeHttp('API 3', { ordineId: prev.data.ordineId }, failAt === 3);
        }
      ];

      steps.reduce(function(promise, step) {
        return promise.then(function(prev) {
          return step(prev);
        });
      }, $q.resolve())
      .then(function(lastRes) {
        // Ultima risposta
        risposte.spedizione = lastRes.data;
        $scope.logs.push({ type: 'success', msg: 'API 3 OK — spedizione: ' + lastRes.data.spedizione + ', giorni: ' + lastRes.data.giorni });
        $scope.logs.push({ type: 'success', msg: '=== Completato! Riepilogo ===' });
        $scope.logs.push({ type: 'success', msg: 'Utente: ' + risposte.utente.nome });
        $scope.logs.push({ type: 'success', msg: 'Ordine: #' + risposte.ordine.ordineId + ' — €' + risposte.ordine.totale });
        $scope.logs.push({ type: 'success', msg: 'Spedizione: ' + risposte.spedizione.spedizione + ' (' + risposte.spedizione.giorni + ' giorni)' });
      })
      .catch(function(err) {
        $scope.logs.push({ type: 'error', msg: '*** ERRORE: ' + err.message });
      });
    };

    $scope.clearLog = function() {
      $scope.logs = [];
    };
  });
  