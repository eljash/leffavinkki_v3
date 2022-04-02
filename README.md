# LeffaVinkki

Kouluprojektin innoittama, mutta täysin pohjalta uusiksi rakennettu.

## Käyttöön otto

Tarvitset .env tiedoston, joka ei löydy git hakemistosta (kysy)

## Onnistunut palvelin käynnistys

Konsolissa näkyy kaksi riviä:
- Palvelin pyörii osoitteessa: http://localhost:PORTIN_NUMERO
- Tietokanta yhteys osoitteesta: TIETOKANNAN_OSOITE

## RestAPI

### /users

- GET
    - Palauttaa kaikki käyttäjäprofiilit

- /register POST
    - body (JSON)
      - email
      - password
      - username
      - firstname (vaihtoehtoinen)
      - lastname (vaihtoehtoinen)
        
    - Onnistunut rekisteröinti palauttaa HTTP 
      statuksen 200 ja tekstin onnistuneesta käyttäjän luomisesta.
  
- /login GET
    - Header avaimet
      - email
      - password
        
    - Onnistunut kirjautuminen palauttaa HTTP statuksen 200 ja 
    JSON objektin, joka sisältää avaimen 'access-token', joka sisältää 
      käyttöoikeustunnuksen.
  
- /update-profile PUT 
    - headers
        - access-token <-- käyttöoikeustunnuksen
        
    - body (JSON) vähintään yksi näistä avaimista:
        - description
        - firstname
        - lastname
      
    - Onnistunut profiilin päivitys palauttaa HTTP
      statuksen 200 ja tekstin onnistuneesta muutoksesta.
      
- /comment-profile POST
    - headers
      - access-token <-- käyttöoikeustunnuksen
      
    - body (JSON)
        - userId <-- kommentoitavan käyttäjän id
        - content <-- kommentin sisältö
        - parentId (vapaaehtoinen) <-- liittyykö kommentti jo aikaisempaan
          kommenttiin
      
    - Onnistunut kommentin jättäminen palauttaa HTTP
          statuksen 200 ja tekstin onnistuneesta kommentista.
      
- /remove-comment DELETE
    - headers
      - access-token <-- käyttöoikeustunnuksen

    - body (JSON)
        - commentId
        
    - Onnistunut kommentin poistaminen palauttaa HTTP
          statuksen 200 ja tekstin onnistuneesta poistosta.
    
- /rate-profile POST
    - headers
        - access-token <-- käyttöoikeustunnuksen
        
    - body (JSON)
      - profileId <-- arvosteltavan profiilin id
      - review <-- numeerinen arvo, muuntuu palvelimella muotoon '-1', '0' tai '1'
      
    - Onnistunut profiilin arvostelu palauttaa HTTP
      statuksen 200 ja tekstin onnistuneesta arvostelun luomisesta.