import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

class User {
    private int id;
    private String name;
    private String email;
    private String role;

    public User(int id, String name, String email, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public int getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getName() {
        return name;
    }
}

public class UserManager {
    private List<User> users = new ArrayList<>();

    public void addUser(User user) {
        for (User existingUser : users) {
            if (existingUser.getEmail().equals(user.getEmail())) {
                throw new IllegalArgumentException("Email already exists");
            }
        }

        users.add(user);
    }

    public Optional<User> findUserByEmail(String email) {
        for (User user : users) {
            if (user.getEmail().equals(email)) {
                return Optional.of(user);
            }
        }

        return Optional.empty();
    }

    public List<User> getAdmins() {
        List<User> admins = new ArrayList<>();

        for (User user : users) {
            if (user.getRole().equals("ADMIN")) {
                admins.add(user);
            }
        }

        return admins;
    }

    public boolean deleteUser(int id) {
        for (User user : users) {
            if (user.getId() == id) {
                users.remove(user);
                return true;
            }
        }

        return false;
    }
}
