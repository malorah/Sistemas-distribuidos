
public class tutoria{

}

private class nodo{
    int value;
    nodo next;

    public nodo(int value){
        this.value = head;
        this.next = null;
    }

    public void add(nodo next){
        if(this.next == null){
            this.next = nodo;
        }else{
            this.next.add(next);
        }
    }
}

private class linkedlist{
    nodo head;
    nodo tail;
    public linkedlist(nodo head){
        this.head = head;
        this.tail = head;
    }
    public linkedlist(int value){
        this.head = new nodo(value);
        this.tail = this.head;
    }
    public void add(nodo next,nodo actual){
        if(actual.next == null){
            actual.next = next;
        }else{
            if(actual.value>next.value){
                add(next,actual.next);
            }else{
                //value actual es menor que value siguiente
                next.next = actual;
            }
            
        }
    }
    public void add(nodo next){
        //add(next,this.head);
        this.head.add(next);
    }
    public void remove(int value){
        if(this.head.value == value){
            this.head = this.head.next;
        }
    }
}
